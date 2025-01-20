import { sql } from "../database/database.js";

const getUser = async (userId) => {
  return await sql`SELECT * FROM person WHERE uuid = ${userId}`;
};

const addUser = async (userUuid, name) => {
  await sql`INSERT INTO person (uuid, name) VALUES (${userUuid}, ${name})`;
  return await sql`SELECT * FROM person WHERE uuid = ${userUuid}`;
};

export { getUser, addUser };
