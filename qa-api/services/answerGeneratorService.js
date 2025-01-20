import * as answerService from "./answerService.js";

/**
 * Generate answer for the given question using the LLM API.
 * @param {Object} question - The question object.
 * @param {string} question.id - The question ID.
 * @param {string} question.question - The question text.
 */
const generateAnswer = async (question) => {
  for (let i = 0; i < 3; i++) {
    const responce = await fetch("http://llm-api:7000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(question),
    });

    if (!responce.ok) {
      console.error("Failed to generate answer for question: ", question);
      return;
    }

    const data = await responce.json();
    const answer = data[0]["generated_text"];

    if (!answer) {
      console.error("Failed to generate answer for question: ", question);
      console.error("Response data from LLM: ", data);
      return;
    }

    await answerService.addAnswer(answer, question.id);
  }
};

export { generateAnswer };
