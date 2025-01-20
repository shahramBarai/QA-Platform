import {
  cachedCourseService,
  cachedQuestionService,
} from "../util/cacheUtil.js";
import * as questionService from "../services/questionService.js";
import * as answerGeneratorService from "../services/answerGeneratorService.js";
import { canPost } from "../services/rateLimitService.js";

const getListOfQuestions = async (req, urlPatternResult) => {
  const courseId = urlPatternResult.pathname.groups.courseId;
  // Get query parameters
  const queryParameters = urlPatternResult.search.input
    .split("&")
    .map((param) => {
      const [key, value] = param.split("=");
      let numValue;
      try {
        numValue = parseInt(value);
      } catch (e) {
        return null;
      }
      return { [key]: numValue };
    });

  if (queryParameters.length !== 2) {
    return new Response("Bad request", { status: 400 });
  }

  if (
    queryParameters[0].offset !== undefined &&
    queryParameters[1].limit !== undefined
  ) {
    const questions = await cachedQuestionService.findAllByCourseId(
      courseId,
      queryParameters[0].offset,
      queryParameters[1].limit
    );
    return Response.json(questions);
  }

  return new Response("Bad request", { status: 400 });
};

const getQuestionInfo = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
  const question = await cachedQuestionService.findById(questionId);
  console.log("----> question", question);

  const course = await cachedCourseService.findById(question.course_id);
  return Response.json({
    id: question.id,
    question: question.question,
    courseId: question.course_id,
    courseName: course.name,
  });
};

const addQuestion = async (req, urlPatternResult) => {
  const courseId = urlPatternResult.pathname.groups.courseId;
  const body = await req.json();
  if (!body.question) {
    return new Response("Bad request: question is missing", { status: 400 });
  }
  if (!body.userUuid) {
    return new Response("Bad request: userUuid required", { status: 400 });
  }

  // Rate-limit for question
  const { allowed, message } = await canPost(body.userUuid, "question");
  if (!allowed) {
    return new Response(message, { status: 429 });
  }

  // Proceed with normal creation if allowed
  const question = { courseId, question: body.question };
  const newQuestion = await cachedQuestionService.addQuestion(question);

  // Starting async answer generation in the background
  answerGeneratorService.generateAnswer(newQuestion);

  return Response.json(newQuestion);
};

const getLikes = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
  const personId = urlPatternResult.pathname.groups.personId;
  const likes = await questionService.getLikes(questionId);
  const likedByUser = await questionService.getLike(questionId, personId);
  return Response.json({ likes, likedByUser: !!likedByUser });
};

const addLike = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
  const body = await req.json();
  if (!body.personId) {
    return new Response("Bad request", { status: 400 });
  }

  const likeExists = await questionService.getLike(questionId, body.personId);

  if (likeExists) {
    return Response.json(likeExists);
  }

  const personId = body.personId;
  const like = await questionService.addLike(questionId, personId);
  return Response.json(like);
};

const deleteLike = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
  const body = await req.json();
  if (!body.personId) {
    return new Response("Bad request", { status: 400 });
  }

  const likeExists = await questionService.getLike(questionId, body.personId);

  if (likeExists) {
    await questionService.deleteLike(questionId, body.personId);
  }

  return new Response("OK", { status: 200 });
};

export {
  getListOfQuestions,
  getQuestionInfo,
  addQuestion,
  getLikes,
  addLike,
  deleteLike,
};
