-- Description: Initial schema for the database

-- TABLES CREATION
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

-- INDEXES
-- Person table indexes
CREATE UNIQUE INDEX idx_person_uuid ON person(uuid);

-- Question table indexes
CREATE INDEX idx_question_course_id ON question(course_id);

-- Answer table indexes
CREATE INDEX idx_answer_question_id ON answer(question_id);