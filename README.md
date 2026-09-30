# WarrantyWave

Automotive warranty and financing platform (Spring Boot 3 / MySQL 8 / Angular 18).

## Deploy with Docker Compose

```bash
cd docker
copy .env.example .env       # PowerShell; set strong, unique values in .env
docker compose up --build -d
```

The application is available at http://localhost (or the configured `HTTP_PORT`). Compose starts MySQL, waits for its health check, starts the API, then starts the Angular/Nginx frontend. MySQL data is persisted in the `mysqldata` volume; the database port is bound to loopback only for local development.

The current Angular screens use the built-in mock API. The Spring backend has persistence models and JWT security but does not yet implement the REST controllers used by those screens; the MySQL container is therefore not used by frontend workflows yet. Do not treat this deployment as a production business application until those API endpoints and real authentication are implemented.

Set `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, and `JWT_SECRET` in `docker/.env` before deployment. Use unique production values; keep `.env` out of source control. `JWT_SECRET` must contain at least 32 bytes. For example, generate one with `openssl rand -base64 48`.

API health: http://localhost:8080/actuator/health when running the backend directly. Swagger UI: http://localhost:8080/swagger-ui.html when running the backend directly.

## Run for development

```bash
cd docker
copy .env.example .env
docker compose up -d database
cd ../backend
$env:JWT_SECRET = "your-local-secret-at-least-32-characters-long"
mvn spring-boot:run
```

In a second terminal, run `cd frontend`, `npm ci`, and `npm start`; the dev server proxies `/api` to http://localhost:8080. The mock API is enabled by default until backend endpoints are implemented.

Run backend tests with `cd backend && mvn test`; run the frontend tests with `cd frontend && npm test`.
