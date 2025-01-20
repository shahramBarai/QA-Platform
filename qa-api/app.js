import { serve } from "./deps.js";
import * as UserController from "./controllers/userController.js";
import * as CourseController from "./controllers/courseController.js";
import * as QuestionController from "./controllers/questionController.js";
import * as AnswerController from "./controllers/answerController.js";

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/users/:userId" }),
    fn: UserController.getUserInfo,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/users" }),
    fn: UserController.addUser,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/courses" }),
    fn: CourseController.getListOfCourses,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/courses/:courseId" }),
    fn: CourseController.getCourseById,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/courses/:courseId/questions" }),
    fn: QuestionController.getListOfQuestions,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/courses/:courseId/questions" }),
    fn: QuestionController.addQuestion,
  },
  {
    method: "GET",
    pattern: new URLPattern({
      pathname: "/questions/:questionId",
    }),
    fn: QuestionController.getQuestionInfo,
  },
  {
    method: "GET",
    pattern: new URLPattern({
      pathname: "/questions/:questionId/likes/:personId",
    }),
    fn: QuestionController.getLikes,
  },
  {
    method: "POST",
    pattern: new URLPattern({
      pathname: "/questions/:questionId/likes",
    }),
    fn: QuestionController.addLike,
  },
  {
    method: "DELETE",
    pattern: new URLPattern({
      pathname: "/questions/:questionId/likes",
    }),
    fn: QuestionController.deleteLike,
  },
  {
    method: "GET",
    pattern: new URLPattern({
      pathname: "/questions/:questionId/answers",
    }),
    fn: AnswerController.getListOfAnswers,
  },
  {
    method: "POST",
    pattern: new URLPattern({
      pathname: "/questions/:questionId/answers",
    }),
    fn: AnswerController.addAnswer,
  },
  {
    method: "GET",
    pattern: new URLPattern({
      pathname: "/answers/:answerId/likes/:personId",
    }),
    fn: AnswerController.getLikes,
  },
  {
    method: "POST",
    pattern: new URLPattern({
      pathname: "/answers/:answerId/likes",
    }),
    fn: AnswerController.addLike,
  },
  {
    method: "DELETE",
    pattern: new URLPattern({
      pathname: "/answers/:answerId/likes",
    }),
    fn: AnswerController.deleteLike,
  },
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);

  try {
    return await mapping.fn(request, mappingResult);
  } catch (error) {
    console.log(error);
    return new Response("Internal server error", { status: 500 });
  }
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
