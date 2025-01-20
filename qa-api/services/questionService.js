import { sql } from "../database/database.js";

const findAllByCourseId = async (courseId, offset, limit) => {
  return await sql`SELECT * FROM question WHERE course_id = ${courseId} ORDER BY id DESC OFFSET ${offset} LIMIT ${limit}`;
};

const findById = async (questionId) => {
  const result = await sql`SELECT * FROM question WHERE id = ${questionId}`;
  return result[0];
};

const addQuestion = async (question) => {
  await sql`INSERT INTO question (course_id, question) VALUES (${question.courseId}, ${question.question})`;
  const newQustion =
    await sql`SELECT * FROM question WHERE course_id = ${question.courseId} AND question = ${question.question}`;
  return newQustion[0];
};

const getLikes = async (questionId) => {
  const result =
    await sql`SELECT COUNT(person_id) AS likes FROM questionLike WHERE question_id = ${questionId}`;
  return result[0].likes;
};

const getLike = async (questionId, personId) => {
  const result =
    await sql`SELECT * FROM questionLike WHERE question_id = ${questionId} AND person_id = ${personId}`;
  return result[0];
};

const addLike = async (questionId, personId) => {
  await sql`INSERT INTO questionLike (question_id, person_id) VALUES (${questionId}, ${personId})`;
  return await getLike(questionId, personId);
};

const deleteLike = async (questionId, personId) => {
  await sql`DELETE FROM questionLike WHERE question_id = ${questionId} AND person_id = ${personId}`;
};

export {
  findAllByCourseId,
  findById,
  addQuestion,
  getLikes,
  getLike,
  addLike,
  deleteLike,
};
