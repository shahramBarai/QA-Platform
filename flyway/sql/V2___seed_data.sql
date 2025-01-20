
-- Insert test courses
INSERT INTO course (name) VALUES 
('Introduction to Programming'),
('Database Design');

-- Insert test questions
INSERT INTO question (question, course_id) VALUES 
('What is a variable?', 1),
('What is normalization?', 2);

-- Insert test answers
INSERT INTO answer (answer, question_id) VALUES 
('A variable is a storage location with a name.', 1),
('Normalization is organizing data to reduce redundancy.', 2);