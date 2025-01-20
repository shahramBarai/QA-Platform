# Reflection for Q&A Platform

## 1. Overview of the Application

My **Q&A platform** is designed to let users:

- **View** courses,
- **Post** questions to specific courses,
- **Provide** answers (including LLM-generated ones),
- **Upvote** questions and answers.

### Key Technologies & Decisions

1. **Astro + Svelte** for the UI layer

   - **Why**: Provides a lightweight, performant front-end experience. Astro’s partial server-side rendering plus Svelte’s reactive components strike a balance between fast initial loads and a dynamic client side.

2. **Deno** (`qa-api`) for the Backend

   - **Why**: Modern runtime with built-in TypeScript support, easy to deploy, lightweight, and secure. Also demonstrates usage of URLPattern-based routing.

3. **Redis** for Caching

   - **Why**: Speeds up frequent queries (e.g., listing questions/answers) by reducing load on the PostgreSQL database. Uses a simple LRU eviction policy.

4. **PostgreSQL** for Persistent Storage

   - **Why**: Relational database with robust indexing, transaction support, and a well-established ecosystem. The schema is kept normalized for clarity (see DATABASE.md).

5. **Playwright** for E2E Testing
   - **Why**: Reliable end-to-end tests that simulate real user interactions across browsers. Ensures the UI flows (home page, course page, question page) work as intended.

6- **k6** for Performance Testing - **Why**: A simple, scriptable tool for load and stress testing. Helps identify potential bottlenecks in both the UI and the API.

## 2. Key Design Decisions

1. **Normalized Schema**

   - I chose to keep the database schema normalized (`person`, `course`, `question`, `answer`, plus join tables for likes) to avoid data inconsistencies and to simplify logical queries. Indexes help keep queries performant.

2. **Caching Approach**

   - Implemented in a **proxy** style, wrapping service functions in a caching layer.
   - Utilizes **separate Redis databases** to handle different caching needs:
     - **DB 0**: Handles caching for question and answer data.
     - **DB 1**: Manages rate-limiting keys to enforce user posting limits.
   - **Cache Invalidation**:
     - **DB 0**: Instead of flushing the entire database when a new question or answer is added, only relevant cache entries are invalidated. This prevents the accidental removal of rate-limiting keys stored in **DB 1**.
     - **DB 1**: Rate-limiting keys remain unaffected by cache invalidation processes, ensuring that rate limits are consistently enforced.
   - **Advantages**:
     - **Isolation**: Keeps rate-limiting logic separate from general caching, enhancing reliability.
     - **Efficiency**: Prevents unnecessary cache misses for rate-limiting when updating question/answer caches.

3. **Microservices in Docker**

   - I separate front-end (qa-ui), back-end (qa-api), and Redis into distinct containers. This modular approach lets us scale or update each service independently.

4. LLM Integration
   - When a new question is posted, the system triggers an LLM to generate additional answers. This is asynchronous, but for simplicity I flush the entire cache upon question creation.

## 3. Possible Improvements & Future Enhancements

Below are some **ideas** on how I can further improve the performance, scalability, and maintainability of the application:

1. **Granular Cache Invalidation**

   - While separating Redis databases effectively prevents rate-limit keys from being flushed, further optimization can be achieved by implementing more granular cache invalidation strategies within each Redis database. For example, using key patterns or namespaces to selectively invalidate caches without affecting unrelated data.

2. **Enhanced Caching Strategies**

   - Explore advanced caching techniques, such as **cache tagging** or **hierarchical caching**, to further optimize data retrieval and invalidation processes within each Redis database.

3. **Sharding / Partitioning**

   - If the question/answer volume for certain courses becomes very large, partitioning or sharding the database might help distribute load and improve query times.

4. **Precomputed “Like Counts”**

   - Storing a real-time `like_count` in the `question` or `answer` table could reduce the overhead of counting in the join tables. This would require carefully updating the count whenever a like or unlike occurs, or using a triggered approach.

5. **Better LLM Answer Handling**

   - Right now, LLM answers are stored immediately and might rely on a short wait time for them to appear. I could incorporate a background queue or more robust asynchronous event system (e.g., RabbitMQ, SQS) for generating and storing those answers, making the system more resilient and decoupled.

6. **Load Balancing & Horizontal Scaling**

   - If the API becomes a bottleneck, I could run multiple `qa-api` containers behind a load balancer. Similarly, I can scale the UI container if front-end traffic spikes.

7. **Improved Observability**

   - Adding metrics (e.g., Prometheus, Grafana) for Docker containers, DB queries, and Redis usage would let us pinpoint performance bottlenecks under heavy load. This ties in well with k6 performance tests.

8. **Security & Auth**
   - Currently, the platform allows anonymous posting and upvoting. Introducing user authentication (e.g., JWT tokens) could add accountability and open up more personalized caching or advanced features.
