package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/patrickmn/go-cache"
	"github.com/pckhoi/casbin-pgx-adapter/v3"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"net/http"

	"github.com/casbin/casbin/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// Config holds application configuration
type Config struct {
	DatabaseURL         string
	JWTSecret           string
	Port                string
	CasbinModelPath     string
	FrontendDir         string
	SendGridAPIKey      string
	SendGridSenderEmail string // Fallback sender email
}

// User represents a user with roles, status, and email
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password"` // Bcrypt-hashed password
	Email     string    `json:"email"`    // User-specific email
	Roles     []string  `json:"roles"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Claims for JWT
type Claims struct {
	UserID   int      `json:"user_id"`
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
	Purpose  string   `json:"purpose,omitempty"` // For password reset tokens
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
	tokenCache = cache.New(24*time.Hour, 48*time.Hour)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Web Portal API",
	})

	// Middleware
	if os.Getenv("ENV") == "development" {
		app.Use(cors.New(cors.Config{
			AllowOrigins: "http://localhost:3000", // For Vite dev server
			AllowMethods: "GET,POST,PUT,DELETE",
		}))
	}
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path}\n",
	}))

	// Serve static assets first
	app.Use("/assets", filesystem.New(filesystem.Config{
		Root: http.FS(os.DirFS(filepath.Join(config.FrontendDir, "assets"))),
	}))

	// API routes
	api := app.Group("/api")
	api.Get("/public", publicHandler)
	api.Post("/login", loginHandler)
	api.Post("/password-reset/request", passwordResetRequestHandler)
	api.Post("/password-reset/confirm", passwordResetConfirmHandler)
	api.Get("/admin", jwtMiddleware, casbinMiddleware("admin"), adminHandler)
	api.Get("/user", jwtMiddleware, casbinMiddleware("end_user_read_only", "end_user_manager"), userHandler)

	// Serve frontend static files with SPA routing for unmatched routes
	app.Use("/", func(c *fiber.Ctx) error {
		// Skip API routes
		if strings.HasPrefix(c.Path(), "/api") {
			return c.Next()
		}
		// Serve index.html for all other routes
		return c.SendFile(filepath.Join(config.FrontendDir, "index.html"))
	})

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
		DatabaseURL:         viper.GetString("DATABASE_URL"),
		JWTSecret:           viper.GetString("JWT_SECRET"),
		Port:                viper.GetString("PORT"),
		CasbinModelPath:     viper.GetString("CASBIN_MODEL_PATH"),
		FrontendDir:         viper.GetString("FRONTEND_DIR"),
		SendGridAPIKey:      viper.GetString("SENDGRID_API_KEY"),
		SendGridSenderEmail: viper.GetString("SENDGRID_SENDER_EMAIL"),
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
	if config.FrontendDir == "" {
		config.FrontendDir = "frontend/dist" // Default frontend build directory
		log.Warn().Msg("FRONTEND_DIR not set, using default frontend/dist")
	}
	if config.SendGridAPIKey == "" {
		return fmt.Errorf("SENDGRID_API_KEY is required")
	}
	// SENDGRID_SENDER_EMAIL is optional, used as fallback
	if config.SendGridSenderEmail == "" {
		log.Warn().Msg("SENDGRID_SENDER_EMAIL not set, using default no-reply@vtinsuranceagency.com")
		config.SendGridSenderEmail = "no-reply@vtinsuranceagency.com"
	}

	// Verify Casbin model file exists
	if _, err := os.Stat(config.CasbinModelPath); os.IsNotExist(err) {
		return fmt.Errorf("Casbin model file not found at %s", config.CasbinModelPath)
	}

	// Verify frontend directory exists
	if _, err := os.Stat(config.FrontendDir); os.IsNotExist(err) {
		log.Warn().Msgf("Frontend directory not found at %s, ensure frontend is built", config.FrontendDir)
	}

	log.Info().Msgf("Configuration loaded: Port=%s, CasbinModelPath=%s, FrontendDir=%s", config.Port, config.CasbinModelPath, config.FrontendDir)
	return nil
}

// initDatabase connects to PostgreSQL using pgxpool
func initDatabase() error {
	var err error
	sanitizedURL := config.DatabaseURL
	if strings.Contains(sanitizedURL, "password=") {
		sanitizedURL = strings.ReplaceAll(sanitizedURL, regexp.MustCompile(`password=[^&]+`).FindString(sanitizedURL), "password=****")
	}
	log.Info().Msgf("Attempting to connect to database with URL: %s", sanitizedURL)
	dbPool, err = pgxpool.New(context.Background(), config.DatabaseURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	// Test connection with retry
	for i := 0; i < 5; i++ {
		if err = dbPool.Ping(context.Background()); err == nil {
			log.Info().Msg("Connected to PostgreSQL")
			return nil
		}
		log.Warn().Err(err).Msgf("Database ping failed, retrying (%d/5)", i+1)
		time.Sleep(2 * time.Second)
	}
	return fmt.Errorf("database ping failed after retries: %w", err)
}

// initCasbin sets up Casbin with pgx adapter
func initCasbin() error {
	log.Info().Msgf("Creating Casbin adapter with DATABASE_URL: %s", config.DatabaseURL)
	adapter, err := pgxadapter.NewAdapter(config.DatabaseURL, pgxadapter.WithTableName("casbin_rule"))
	if err != nil {
		log.Error().Err(err).Msg("Failed to create Casbin adapter")
		return fmt.Errorf("failed to create Casbin adapter: %w", err)
	}

	log.Info().Msgf("Creating Casbin enforcer with model: %s", config.CasbinModelPath)
	enforcer, err = casbin.NewEnforcer(config.CasbinModelPath, adapter)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create Casbin enforcer")
		return fmt.Errorf("failed to create Casbin enforcer: %w", err)
	}

	// Load policies from database
	log.Info().Msg("Loading Casbin policies from casbin_rule table")
	if err := enforcer.LoadPolicy(); err != nil {
		log.Error().Err(err).Msg("Failed to load Casbin policies")
		return fmt.Errorf("failed to load Casbin policies: %w", err)
	}

	policies, err := enforcer.GetPolicy()
	if err != nil {
		log.Error().Err(err).Msg("Failed to get Casbin policies")
		return fmt.Errorf("failed to get Casbin policies: %w", err)
	}
	log.Info().Msgf("Loaded %d Casbin policies: %v", len(policies), policies)

	// Fallback: Manually add policies if none loaded
	if len(policies) == 0 {
		log.Warn().Msg("No policies loaded, attempting manual policy insertion")
		_, err = enforcer.AddPolicy("admin", "/api/admin", "GET")
		if err != nil {
			log.Error().Err(err).Msg("Failed to add manual admin policy")
			return fmt.Errorf("failed to add manual admin policy: %w", err)
		}
		_, err = enforcer.AddPolicy("end_user_read_only", "/api/user", "GET")
		if err != nil {
			log.Error().Err(err).Msg("Failed to add manual end_user_read_only policy")
			return fmt.Errorf("failed to add manual end_user_read_only policy: %w", err)
		}
		_, err = enforcer.AddPolicy("end_user_manager", "/api/user", "GET")
		if err != nil {
			log.Error().Err(err).Msg("Failed to add manual end_user_manager policy")
			return fmt.Errorf("failed to add manual end_user_manager policy: %w", err)
		}
		policies, err = enforcer.GetPolicy()
		if err != nil {
			log.Error().Err(err).Msg("Failed to get Casbin policies after manual insertion")
			return fmt.Errorf("failed to get Casbin policies: %w", err)
		}
		log.Info().Msgf("Manually loaded %d Casbin policies: %v", len(policies), policies)
	}

	log.Info().Msg("Casbin initialized")
	return nil
}

// jwtMiddleware verifies JWT tokens
func jwtMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		log.Warn().Msg("Missing Authorization header")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing Authorization header"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	log.Info().Msgf("Received token: %s", tokenString[:10]+"...")
	if _, found := tokenCache.Get(tokenString); !found {
		log.Warn().Msg("Token not found in cache")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		log.Error().Err(err).Msg("Invalid token")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		log.Error().Msg("Invalid claims type")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid claims"})
	}

	log.Info().Msgf("Validated claims: %+v", claims)
	c.Locals("user", claims)
	return c.Next()
}

// casbinMiddleware enforces RBAC
func casbinMiddleware(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := c.Locals("user").(*Claims)
		path := c.Path()
		method := c.Method()
		log.Info().Msgf("Checking roles %v for path %s and method %s", claims.Roles, path, method)

		for _, role := range claims.Roles {
			if ok, err := enforcer.Enforce(role, path, method); err == nil && ok {
				log.Info().Msgf("Access granted for role %s", role)
				return c.Next()
			} else if err != nil {
				log.Error().Err(err).Msgf("Casbin enforce error for role %s", role)
			} else {
				log.Warn().Msgf("Policy not found for role %s, path %s, method %s", role, path, method)
			}
		}

		log.Warn().Msgf("Access denied for roles %v on path %s", claims.Roles, path)
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

	// Query user from database
	var user User
	err := dbPool.QueryRow(context.Background(),
		"SELECT id, username, password, username, roles, status, created_at, updated_at FROM users WHERE username = $1",
		input.Username).Scan(&user.ID, &user.Username, &user.Password, &user.Email, &user.Roles, &user.Status, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		log.Error().Err(err).Msg("Failed to query user")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	log.Info().Msgf("Deserialized roles for %s: %v", input.Username, user.Roles)

	// Check user status
	if user.Status != "active" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": fmt.Sprintf("Account is %s", user.Status)})
	}

	// Verify password
	if !checkPassword(input.Password, user.Password) {
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
		log.Error().Err(err).Msg("Failed to generate token")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	// Store token in cache
	tokenCache.Set(tokenString, true, cache.DefaultExpiration)

	return c.JSON(fiber.Map{"token": tokenString})
}

// passwordResetRequestHandler generates and sends a password reset token
func passwordResetRequestHandler(c *fiber.Ctx) error {
	var input struct {
		Username string `json:"username"`
	}

	if err := c.BodyParser(&input); err != nil {
		log.Warn().Err(err).Msg("Invalid password reset request input")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Find user
	var user User
	err := dbPool.QueryRow(context.Background(),
		"SELECT id, username, username FROM users WHERE username = $1 AND status = 'active'",
		input.Username).Scan(&user.ID, &user.Username, &user.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Warn().Msgf("Password reset requested for non-existent or inactive user: %s", input.Username)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found or inactive"})
		}
		log.Error().Err(err).Msg("Failed to query user for password reset")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	// Validate user email
	recipientEmail := user.Email
	if recipientEmail == "" {
		log.Warn().Msgf("No email found for user %s, using default", user.Username)
		recipientEmail = user.Username + "@example.com" // Fallback for testing; update for production
	}

	// Generate reset token
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Purpose:  "password_reset",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.JWTSecret))
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate reset token")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate reset token"})
	}

	// Store token in database
	expiresAt := time.Now().Add(1 * time.Hour)
	_, err = dbPool.Exec(context.Background(),
		"INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
		user.ID, tokenString, expiresAt)
	if err != nil {
		log.Error().Err(err).Msg("Failed to store reset token")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	// Send reset email via SendGrid
	resetLink := fmt.Sprintf("http://localhost:8080/reset?token=%s", tokenString) // Update to production domain
	from := mail.NewEmail("VT Insurance Agency", config.SendGridSenderEmail)
	subject := "Password Reset Request"
	to := mail.NewEmail(user.Username, recipientEmail)
	content := mail.NewContent("text/html", fmt.Sprintf(`
           <h2>Password Reset Request</h2>
           <p>Click the link below to reset your password:</p>
           <p><a href="%s">Reset Password</a></p>
           <p>This link expires in 1 hour.</p>
           <p>If you did not request this, please ignore this email.</p>
           <p>VT Insurance Agency</p>
       `, resetLink))
	m := mail.NewV3MailInit(from, subject, to, content)

	client := sendgrid.NewSendClient(config.SendGridAPIKey)
	response, err := client.Send(m)
	if err != nil {
		log.Error().Err(err).Msgf("Failed to send reset email to %s", recipientEmail)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send reset email"})
	}
	if response.StatusCode >= 400 {
		log.Error().Msgf("SendGrid failed with status %d: %s", response.StatusCode, response.Body)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send reset email"})
	}

	log.Info().Msgf("Password reset email sent to %s from %s", recipientEmail, config.SendGridSenderEmail)
	return c.JSON(fiber.Map{"message": "Password reset email sent"}) // Remove resetLink in production
}

// passwordResetConfirmHandler validates the token and updates the password
func passwordResetConfirmHandler(c *fiber.Ctx) error {
	var input struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	if err := c.BodyParser(&input); err != nil {
		log.Warn().Err(err).Msg("Invalid password reset confirm input")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Validate token
	token, err := jwt.ParseWithClaims(input.Token, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		log.Warn().Err(err).Msg("Invalid or expired reset token")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || claims.Purpose != "password_reset" {
		log.Warn().Msg("Invalid reset token claims")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	// Verify token in database
	var tokenID int
	var userID int
	var expiresAt time.Time
	err = dbPool.QueryRow(context.Background(),
		"SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND user_id = $2",
		input.Token, claims.UserID).Scan(&tokenID, &userID, &expiresAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Warn().Msg("Reset token not found or invalid")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
		}
		log.Error().Err(err).Msg("Failed to query reset token")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	if time.Now().After(expiresAt) {
		log.Warn().Msg("Reset token expired")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token expired"})
	}

	// Hash new password
	hashedPassword := hashPassword(input.NewPassword)

	// Update user password
	_, err = dbPool.Exec(context.Background(),
		"UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
		hashedPassword, userID)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update password")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	// Delete used token
	_, err = dbPool.Exec(context.Background(),
		"DELETE FROM password_reset_tokens WHERE id = $1", tokenID)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to delete reset token")
	}

	log.Info().Msgf("Password reset successful for user ID %d", userID)
	return c.JSON(fiber.Map{"message": "Password reset successful"})
}

// adminHandler is for admin role
func adminHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Admin access granted"})
}

// userHandler is for end_user_read_only and end_user_manager roles
func userHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "User access granted"})
}

// hashPassword generates a bcrypt-hashed password
func hashPassword(password string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash)
}

// checkPassword verifies a password against a bcrypt hash
func checkPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
