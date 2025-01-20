import { cachedAnswerService } from "../util/cacheUtil.js";
import * as answerService from "../services/answerService.js";
import { canPost } from "../services/rateLimitService.js";

const getListOfAnswers = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
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
    const answers = await cachedAnswerService.getAnswersByQuestionId(
      questionId,
      queryParameters[0].offset,
      queryParameters[1].limit
    );
    return Response.json(answers);
  }

  return new Response("Bad request", { status: 400 });
};

const addAnswer = async (req, urlPatternResult) => {
  const questionId = urlPatternResult.pathname.groups.questionId;
  const body = await req.json();
  if (!body.answer) {
    return new Response("Bad request: answer is missing", { status: 400 });
  }
  if (!body.userUuid) {
    return new Response("Bad request: userUuid required", { status: 400 });
  }

  // Rate-limit for question
  const { allowed, message } = await canPost(body.userUuid, "answer");
  if (!allowed) {
    return new Response(message, { status: 429 });
  }

  // Proceed with normal creation if allowed
  const newAnswer = await cachedAnswerService.addAnswer(
    body.answer,
    questionId
  );
  return Response.json(newAnswer);
};

const getLikes = async (req, urlPatternResult) => {
  const answerId = urlPatternResult.pathname.groups.answerId;
  const personId = urlPatternResult.pathname.groups.personId;
  const likes = await answerService.getLikes(answerId);
  const likedByUser = await answerService.getLike(answerId, personId);
  return Response.json({ likes, likedByUser: !!likedByUser });
};

const addLike = async (req, urlPatternResult) => {
  const answerId = urlPatternResult.pathname.groups.answerId;
  const body = await req.json();
  if (!body.personId) {
    return new Response("Bad request", { status: 400 });
  }

  const likeExists = await answerService.getLike(answerId, body.personId);

  if (likeExists) {
    return Response.json(likeExists);
  }

  const personId = body.personId;
  const like = await answerService.addLike(answerId, personId);
  return Response.json(like);
};

const deleteLike = async (req, urlPatternResult) => {
  const answerId = urlPatternResult.pathname.groups.answerId;
  const body = await req.json();
  if (!body.personId) {
    return new Response("Bad request", { status: 400 });
  }

  const likeExists = await answerService.getLike(answerId, body.personId);

  if (likeExists) {
    await answerService.deleteLike(answerId, body.personId);
  }

  return new Response("OK", { status: 200 });
};

export { getListOfAnswers, addAnswer, getLikes, addLike, deleteLike };
