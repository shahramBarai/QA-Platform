import { sql } from "../database/database.js";

const getAnswersByQuestionId = async (questionId, offset, limit) => {
  return await sql`SELECT * FROM answer WHERE question_id = ${questionId} ORDER BY id DESC OFFSET ${offset} LIMIT ${limit}`;
};

const addAnswer = async (answer, questionId) => {
  await sql`INSERT INTO answer (question_id, answer) VALUES (${questionId}, ${answer})`;
  return await sql`SELECT * FROM answer WHERE question_id = ${questionId} AND answer = ${answer}`;
};

const getLikes = async (answerId) => {
  const result =
    await sql`SELECT COUNT(person_id) AS likes FROM answerLike WHERE answer_id = ${answerId}`;
  return result[0].likes;
};

const getLike = async (answerId, personId) => {
  const result =
    await sql`SELECT * FROM answerLike WHERE answer_id = ${answerId} AND person_id = ${personId}`;
  return result[0];
};

const addLike = async (answerId, personId) => {
  await sql`INSERT INTO answerLike (answer_id, person_id) VALUES (${answerId}, ${personId})`;
  return await getLike(answerId, personId);
};

const deleteLike = async (answerId, personId) => {
  await sql`DELETE FROM answerLike WHERE answer_id = ${answerId} AND person_id = ${personId}`;
};

export {
  getAnswersByQuestionId,
  addAnswer,
  getLikes,
  getLike,
  addLike,
  deleteLike,
};
