package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/patrickmn/go-cache"
	"github.com/pckhoi/casbin-pgx-adapter"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"

	"github.com/casbin/casbin/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Config holds application configuration
type Config struct {
	DatabaseURL     string
	JWTSecret       string
	Port            string
	CasbinModelPath string
}

// User represents a user with roles
type User struct {
	ID       int
	Username string
	Password string // Hashed password
	Roles    []string
}

// Claims for JWT
type Claims struct {
	UserID   int      `json:"user_id"`
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
	jwt.RegisteredClaims
}

// Global variables
var (
	config     Config
	dbPool     *pgxpool.Pool
	enforcer   *casbin.Enforcer
	tokenCache *cache.Cache
)

func main() {
	// Initialize logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()

	// Load configuration
	if err := initConfig(); err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Initialize database
	if err := initDatabase(); err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer dbPool.Close()

	// Initialize Casbin
	if err := initCasbin(); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize Casbin")
	}

	// Initialize token cache
	tokenCache = cache.New(5*time.Minute, 10*time.Minute)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Web Portal API",
	})

	// Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000", // Update for production
		AllowMethods: "GET,POST,PUT,DELETE",
	}))
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path}\n",
	}))

	// Routes
	app.Get("/api/public", publicHandler)
	app.Post("/api/login", loginHandler)

	// Protected routes
	api := app.Group("/api", jwtMiddleware)
	api.Get("/admin", casbinMiddleware("admin"), adminHandler)
	api.Get("/user", casbinMiddleware("end_user_read_only", "end_user_manager"), userHandler)

	// Start server
	addr := fmt.Sprintf(":%s", config.Port)
	log.Info().Msgf("Starting server on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}

// initConfig loads environment variables using viper
func initConfig() error {
	viper.SetConfigFile(".env")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Warn().Err(err).Msg("No .env file found, relying on environment variables")
	}

	config = Config{
		DatabaseURL:     viper.GetString("DATABASE_URL"),
		JWTSecret:       viper.GetString("JWT_SECRET"),
		Port:            viper.GetString("PORT"),
		CasbinModelPath: viper.GetString("CASBIN_MODEL_PATH"),
	}

	if config.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if config.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if config.Port == "" {
		config.Port = "8080" // Default port
		log.Warn().Msg("PORT not set, using default 8080")
	}
	if config.CasbinModelPath == "" {
		return fmt.Errorf("CASBIN_MODEL_PATH is required")
	}

	// Verify Casbin model file exists
	if _, err := os.Stat(config.CasbinModelPath); os.IsNotExist(err) {
		return fmt.Errorf("Casbin model file not found at %s", config.CasbinModelPath)
	}

	log.Info().Msgf("Configuration loaded: Port=%s, CasbinModelPath=%s", config.Port, config.CasbinModelPath)
	return nil
}

// initDatabase connects to PostgreSQL using pgxpool
func initDatabase() error {
	var err error
	dbPool, err = pgxpool.New(context.Background(), config.DatabaseURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	// Test connection
	if err := dbPool.Ping(context.Background()); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	log.Info().Msg("Connected to PostgreSQL")
	return nil
}

// initCasbin sets up Casbin with pgx adapter
func initCasbin() error {
	adapter, err := pgxadapter.NewAdapter(config.DatabaseURL, pgxadapter.WithTableName("casbin_rule"))
	if err != nil {
		return fmt.Errorf("failed to create Casbin adapter: %w", err)
	}

	enforcer, err = casbin.NewEnforcer(config.CasbinModelPath, adapter)
	if err != nil {
		return fmt.Errorf("failed to create Casbin enforcer: %w", err)
	}

	// Load policies from database
	if err := enforcer.LoadPolicy(); err != nil {
		return fmt.Errorf("failed to load Casbin policies: %w", err)
	}

	log.Info().Msg("Casbin initialized")
	return nil
}

// jwtMiddleware verifies JWT tokens
func jwtMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if _, found := tokenCache.Get(tokenString); !found {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid claims"})
	}

	c.Locals("user", claims)
	return c.Next()
}

// casbinMiddleware enforces RBAC
func casbinMiddleware(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := c.Locals("user").(*Claims)
		path := c.Path()
		method := c.Method()

		for _, role := range claims.Roles {
			if ok, err := enforcer.Enforce(role, path, method); err == nil && ok {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Access denied"})
	}
}

// publicHandler is accessible to all
func publicHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Welcome to the public API"})
}

// loginHandler authenticates users
func loginHandler(c *fiber.Ctx) error {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Mock user lookup (replace with pgx query)
	user := User{
		ID:       1,
		Username: "admin",
		Password: hashPassword("admin123"), // Pre-hashed for demo
		Roles:    []string{"admin"},
	}

	if input.Username != user.Username || !checkPassword(input.Password, user.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// Generate JWT
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Roles:    user.Roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	// Store token in cache
	tokenCache.Set(tokenString, true, cache.DefaultExpiration)

	return c.JSON(fiber.Map{"token": tokenString})
}

// adminHandler is for admin role
func adminHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Admin access granted"})
}

// userHandler is for end_user_read_only and end_user_manager roles
func userHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "User access granted"})
}

// hashPassword generates a hashed password
func hashPassword(password string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash)
}

// checkPassword verifies a password
func checkPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
