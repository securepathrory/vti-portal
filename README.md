# Web Portal

A Go-based web portal backend using Fiber, pgx, JWT, Casbin, and zerolog, deployed on Kubernetes with HAProxy.

## Setup

1. **Install Go**: Ensure Go 1.21+ is installed.
2. **Set up PostgreSQL**:
   - Create a database (e.g., `portal`).
   - Create the `casbin_rule` table:
     ```sql
     CREATE TABLE casbin_rule (
         id SERIAL PRIMARY KEY,
         ptype VARCHAR(100),
         v0 VARCHAR(100),
         v1 VARCHAR(100),
         v2 VARCHAR(100),
         v3 VARCHAR(100),
         v4 VARCHAR(100),
         v5 VARCHAR(100)
     );
     ```
   - Insert example policies:
     ```sql
     INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
         ('p', 'admin', '/api/admin', 'GET'),
         ('p', 'end_user_read_only', '/api/user', 'GET'),
         ('p', 'end_user_manager', '/api/user', 'GET');
     ```
3. **Install dependencies**:
   ```bash
   cd web-portal
   go mod tidy
   ```
4. **Run the application**:
   ```bash
   go run ./cmd/portal
   ```
5. **Test routes**:
   - Public: `curl http://localhost:8080/api/public`
   - Login: `curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:8080/api/login`
   - Admin: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/admin`
   - User: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/user`

## Kubernetes Deployment

- Build the Docker image: `docker build -t portal-backend:latest -f deployments/Dockerfile .`
- Create Kubernetes manifests in `deployments/kubernetes/`.
- Use ConfigMaps/Secrets for environment variables.
- Configure HAProxy ingress for routing.

## Next Steps

- Replace mock user lookup in `loginHandler` with a pgx query.
- Add database migrations in `migrations/`.
- Implement React/MUI frontend.
