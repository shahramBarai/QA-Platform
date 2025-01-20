import { sql } from "../database/database.js";

const findAll = async () => {
  return await sql`SELECT * FROM course`;
};

const findById = async (id) => {
  const result = await sql`SELECT * FROM course WHERE id = ${id}`;
  return result[0];
};

export { findAll, findById };
