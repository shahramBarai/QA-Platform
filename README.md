# Q&A Platform

This project is a Question and Answer web application designed for coursework discussions. It allows users to:

- **View** courses and **post questions** related to those courses
- **Provide** answers (including **LLM-generated** answers)
- **Upvote** questions and answers to surface the most helpful content
- **Cache** frequently accessed data for improved performance

The system demonstrates **scalability** and best practices, integrating **multiple services**, **caching**, **end-to-end testing**, and **performance testing**.

## Features

1. **Database**

   - Uses **PostgreSQL** for structured data storage (courses, questions, answers, likes).
   - Flyway manages schema migrations under [flyway/sql](flyway/sql/).

2. **Caching**

   - Incorporates **Redis** to cache frequent queries (like listing questions/answers).
   - Utilizes **separate Redis databases**:
     - **DB 0**: Caches question and answer data.
     - **DB 1**: Manages rate-limiting keys to enforce user posting limits.
   - Flushing strategies ensure data remains fresh when new questions or answers are added without affecting rate limits.

3. **End-to-End Tests**

   - Uses **Playwright** to confirm the UI flows (home page, course page, question page) function correctly.
   - Tests are located in [e2e-playwright/tests](e2e-playwright/tests/).

4. **Performance Tests**

   - Leverages **k6** scripts in the [k6/](k6/) folder to measure and optimize performance under various load scenarios.

5. **User Interactions**

   - Upvoting logic for questions and answers via join tables in the database (`questionLike`, `answerLike`).

6. **Styling & Framework**

   - The UI is built with **Astro**, **Svelte**, and **TailwindCSS** for a modern, efficient front-end.
   - The back-end uses **Deno** for the `qa-api` service, with a focus on simplicity and performance.

7. **Rate Limiting**

   - Enforces that a **single user** (identified by `userUuid`) can post **at most one question and one answer per minute**.
   - Implemented using a **separate Redis database** to manage rate-limiting without interfering with cached data.

8. **Separate Configurations for Development and Production**
   - Docker setups ([docker-compose.yml](docker-compose.yml) for dev, [docker-compose.prod.yml](docker-compose.prod.yml) for production) to demonstrate how the app scales in different environments.

## Project Structure

A brief overview of the main directories (subject to change as the project evolves):

```plaintext
├── e2e-playwright
│   └── tests/                  # End-to-end tests (Playwright)
├── flyway
│   └── sql/                    # Database migration scripts (Flyway)
├── k6                          # Performance testing scripts (k6)
├── llm-api                     # LLM API client for generating answers
├── nginx                       # NGINX configuration for routing
├── qa-api
│   ├── controllers             # API controllers for courses, questions, answers, users
│   ├── database                # PostgreSQL interactions for Deno
│   ├── services                # Business logic (caching, LLM calls, etc.)
│   └── util                    # Utility functions (cache proxies, etc.)
├── qa-ui                       # User interface (Astro, Svelte and Tailwind)
├── redis                       # Redis configuration (redis.conf)
├── docker-compose.prod.yml     # Production Docker Compose setup
├── docker-compose.yml          # Development Docker Compose setup
├── DATABASE.md                 # Database schema and caching strategy
├── PERFORMANCE_TEST_RESULTS.md # Performance testing results
├── REFLECTION.md               # Key design decisions and potential improvements
├── RUNNING.md                  # Deployment and testing instructions
└── README.md                   # This file
```

## Deployment and Testing

For details on deploying the application locally, along with instructions for running the end-to-end tests and performance tests, see [RUNNING.md](RUNNING.md). This file outlines:

- How to run the application in **development mode** with Docker Compose,
- How to migrate and start the system in **production mode**,
- How to invoke **Playwright E2E tests** in Docker,
- How to launch **k6 performance tests**.

My performance testing results can be found in [PERFORMANCE.md](PERFORMANCE.md).

## Database Schema

A short discussion of the applications database schema and caching strategy can be found in [DATABASE.md](DATABASE.md).

## Reflection

A short discussion of the application’s **key design decisions** (e.g., normalized database schema, caching approach, LLM integration) and **potential improvements** for performance can be found in [REFLECTION.md](REFLECTION.md).
