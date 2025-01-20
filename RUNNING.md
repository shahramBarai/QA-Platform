# Deploying and testing the application

This document explains how to deploy and test the application locally using **Docker**, **Playwright**, and **k6**.

## 1. Prerequisites and setup

To run the application locally, you need to have the following installed on your machine:

1. **Docker & Docker Compose**
   - Make sure you have Docker (v20+) and Docker Compose (v2+) installed on your machine.
2. **Node.js and npm**
   - Required if you plan to install packages or run scripts locally (e.g., if you want to run Playwright tests outside of Docker or manage build tasks).
3. **k6** (for performance testing) -
   - Install k6 if you plan to run load/performance tests from your local machine.

### Project setup

1. **Unzip** or **clone** the project folder to a local directory.
2. **Navigate** to the project directory in your terminal.

## 2. Running the application

The application has separate configurations for development and production.

- **Development mode** is recommended if you want to modify code, run end-to-end tests, or develop locally
- **Production mode** provides a more optimized configuration if you just want to see the app in an environment closer to how it would look in production.

### Development mode

1. Start the application with:

   ```bash
   docker compose up
   ```

2. Wait for all services (database, Redis, APIs, UI) to finish initialization.
3. The application should be available at http://localhost:7800.

**Note:** In development mode, code changes in certain services (like the UI or API) will be automatically reflected in the running application.

### Production mode

1. **First-time database migration** (if you haven’t run migrations before):

   ```bash
   docker compose -f docker-compose.prod.yml --profile migrate up --build -d
   ```

   This runs Flyway or other migration services to prepare the production database.

2. **Subsequent runs** (or if the database is already migrated):

   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

3. Once all containers are up, the application should be available at http://localhost:7800.

**Note:** The `-d` flag runs the containers in detached mode. If you want to see the logs, you can remove this flag.
**Note:** The `--build` flag ensures that the latest code changes are reflected in the running containers. You can omit this flag if you don’t want to rebuild the images.

## 3. Testing the application

### End-to-end testing

I use Playwright for end-to-end tests. In development mode:

```bash
docker compose up e2e-playwright
```

This command spins up all required services (if not already running) and then runs the **Playwright** tests in the `e2e-playwright` container.

- **Results** will appear in the terminal once the tests complete.

**Note:** If you prefer running Playwright locally (outside Docker), ensure you have **Node.js** and Playwright installed, then run `npm install` in the e2e-playwright directory and run the tests with `npm test`.

### Performance testing

I use k6 for load and performance tests. Ensure you have **k6** installed on your machine, then run any of the scripts in the `k6/` folder. For example:

```bash
k6 run test-qa-ui-http.js
```

- Tests the HTTP endpoints exposed by the UI (like fetching the homepage, course page, etc.).

```bash
k6 run test-qa-api-scenarios.js
```

- Exercises various API scenarios (courses, users, questions, answers) to check performance under specific arrival rates and concurrency.

The test results appear directly in your terminal. You can reference [PERFORMANCE_TEST_RESULTS.md](PERFORMANCE_TEST_RESULTS.md) for a sample of the reported metrics and a summary of performance findings.

## 4. Stopping the application

- In development mode: `Ctrl + C` in your terminal where `docker compose up` is running, or `docker compose down` in a separate terminal.
- In production mode: `docker compose -f docker-compose.prod.yml down`

## 5. Troubleshooting

- If you encounter port conflicts, ensure `7800` (Nginx) or other container ports aren’t in use.
- For debugging E2E tests, you can run `docker logs e2e-playwright` (adjust container name if different) or open an interactive shell to see additional details.
