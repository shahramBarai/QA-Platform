# Database Schema Design for Q&A Platform

This document provides an overview of the **PostgreSQL** database schema used by Q&A platform. It describes the **tables**, **indexes**, and **denormalization** decisions, as well as caching considerations made to optimize performance and reduce redundant data fetching.

## 1. Database Schema Overview

My database consists of six primary tables to support the Q&A functionality:

1. `person`

   - Stores user information (identified by a `uuid`).
   - Contains minimal fields: `id`, `uuid`, and `name`.

2. `course`

   - Represents a course, each having an `id`, a `created_at` timestamp, and a `name`.

3. `question`

   - Stores individual questions.
   - References a `course_id` to indicate which course the question belongs to.
   - `question` text and `created_at` are also stored.

4. `questionLike`

   - **A join table** (many-to-many relationship) that associates `question`s with `person`s who have liked them.
   - Primary key is the combination `(question_id, person_id)`.

5. `answer`

   - Represents answers to questions.
   - Each `answer` references the `question_id` it answers and has its own `created_at` timestamp.

6. `answerLike`
   - Another join table linking `answer`s to `person`s who have liked them.
   - Primary key is `(answer_id, person_id)`.

#### Schema Snapshot ([V1\_\_\_initial_schema.sql](flyway/sql/V1___initial_schema.sql))

```sql
CREATE TABLE person (
    id SERIAL PRIMARY KEY,
    uuid TEXT NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE course (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE question (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    course_id INTEGER REFERENCES course(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE questionLike (
    question_id INTEGER REFERENCES question(id),
    person_id INTEGER REFERENCES person(id),
    PRIMARY KEY (question_id, person_id)
);

CREATE TABLE answer (
    id SERIAL PRIMARY KEY,
    answer TEXT NOT NULL,
    question_id INTEGER REFERENCES question(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE answerLike (
    answer_id INTEGER REFERENCES answer(id),
    person_id INTEGER REFERENCES person(id),
    PRIMARY KEY (answer_id, person_id)
);
```

## 2. Indexing Strategy

I use a few key indexes to improve query performance:

1. `idx_person_uuid` (Unique index on `person(uuid)`)

   - Ensures fast lookups when fetching user details by `uuid`.
   - Also enforces uniqueness of `uuid`, preventing duplicates.

2. `idx_question_course_id` (Index on `question(course_id)`)

   - Speeds up queries retrieving questions by course.
   - Important for listing all questions associated with a given course.

3. `idx_answer_question_id` (Index on `answer(question_id)`)
   - Used when fetching multiple answers for a single question.
   - Improves performance in queries like _“SELECT \* FROM answer WHERE question_id = ?”_ especially under load.

#### Why These Indexes?

- `person.uuid`: I often fetch or create a user by a unique UUID, so a unique index ensures both fast lookup and uniqueness constraints.
- `question.course_id`: Since I frequently group or filter questions by course, an index on course_id is crucial for quick access.
- `answer.question_id`: Answers are typically fetched by their `question_id`, so indexing that column helps reduce query time for read operations.

## 3. Database Denormalization Decisions

At this stage, the schema is largely normalized:

- `person`, `course`, `question`, `answer` are each in their own tables, referencing each other via foreign keys (`course_id`, `question_id`).
- The “like” relationships (`questionLike` and `answerLike`) use join tables for many-to-many relationships.

#### Why Minimal Denormalization?

- By keeping the schema normalized, I avoid data anomalies when updating or deleting references.
- The queries remain straightforward. A typical Q&A site structure maps well to these relations.
- Because I rely on indexes (and caching in some cases), the overhead of multiple tables is manageable, and typical Q&A workloads are read-heavy, so normalization with good indexes is efficient.

**Potential Denormalization** could involve storing “number of likes” directly on `question` or `answer` for immediate retrieval. However, in my current design, I calculate likes from the join table. I rely on caching (see below) to keep this fast, rather than duplicating fields in multiple places.

## 4. Caching Strategy

I use **Redis** to **cache** selected database queries and manage rate-limiting, implemented as follows:

1. **Separate Redis Databases**

   - **DB 0**:

     - **Purpose**: Caches question and answer data (e.g., `findAllByCourseId`, `getAnswersByQuestionId`).
     - **Usage**: All caching-related operations for read-heavy endpoints are directed here.

   - **DB 1**:
     - **Purpose**: Manages rate-limiting keys to enforce user posting limits.
     - **Usage**: Stores keys like `post-limit:${userUuid}:question` and `post-limit:${userUuid}:answer` to restrict users to one question and one answer per minute.

2. **Service-Specific Proxies**

   - `cachedCourseService`: Caches most read operations for courses (e.g., `findById`).
   - `cachedQuestionService`: Caches reads like `findAllByCourseId`, `findById`; invalidates relevant cache entries in **DB 0** when a new question (`addQuestion`) is added.
   - `cachedAnswerService`: Caches read operations for answers (`getAnswersByQuestionId`); invalidates relevant cache entries in **DB 0** when a new answer (`addAnswer`) is added.

3. **Rate Limiting**

   - Implemented in **DB 1**, ensuring that rate-limiting keys are **not affected** by cache invalidation operations on **DB 0**.
   - **Rate Limit Keys**: Structured as `post-limit:${userUuid}:${postType}` where `postType` is either `question` or `answer`.
   - **Expiry**: Each rate-limit key is set with a **60-second** expiration to enforce the one-post-per-minute rule.

4. **When We Do Not Cache**
   - **User-related lookups**: We do **not** currently cache user calls (`userController` uses `userService` directly). These are typically less frequent and revolve around a unique `uuid`, so performance is already sufficient without caching.
   - **Like operations**: For `questionLike` and `answerLike`, we bypass caching because likes might change frequently (adding or removing likes). Maintaining a real-time count can be trickier with caching, so we prefer direct DB reads and writes for those.

## 5. Seed Data

I optionally seed some initial data ([flyway/sql/V2\_\_seed_data.sql](flyway/sql/V2___seed_data.sql)):

- **Courses**: e.g. “Introduction to Programming,” “Database Design”
- **Questions**: e.g. “What is a variable?”, “What is normalization?”
- **Answers**: e.g. “A variable is a storage location...”, “Normalization is organizing data...”

This provides a quick starting set of records to test basic functionality (listing courses, retrieving questions, etc.).

## 6. Future Considerations

- **Granular Invalidation**: Instead of `flushdb()`, I might refine caching keys to only remove stale entries upon insert or update.
- **Denormalization**: If read loads grow, storing a `like_count` on `question` or `answer` might reduce frequent join table queries. This would require carefully updating `like_count` whenever a like is added or removed.
- **Sharding or Partitioning**: If the question/answer volume grows extremely large, I might explore database sharding or partitioned tables to split data by course or date range.
- **Advanced Indexing**: For complex queries (filtering or searching text), I might add a GIN or full-text index on `question`/`answer` fields.

## Summary

My database design focuses on **normalized** tables for clarity and maintainability, leveraging indexes to handle typical read queries effectively. **Caching** (via Redis) accelerates common fetch operations, reducing direct DB load. As usage scales, further refinement of caching (granular invalidation) or limited denormalization (like storing aggregated “like” counts) may be introduced to keep performance robust under higher traffic.

Overall, this architecture balances **simplicity** with **performance** through strategic indexing and caching. If you have any questions or suggestions, feel free to raise them in the project’s issue tracker or contact the team.
