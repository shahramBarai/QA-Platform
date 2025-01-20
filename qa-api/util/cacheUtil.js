import { Redis } from "../deps.js";
import * as courseService from "../services/courseService.js";
import * as questionService from "../services/questionService.js";
import * as answerService from "../services/answerService.js";

const redis = new Redis("redis://redis:6379/0");
redis.on("error", (err) => console.log("Redis Client Error", err));

const cacheMethodCalls = (
  serviceName,
  object,
  methodsToFlushCacheWith = []
) => {
  const handler = {
    get: (module, methodName) => {
      const method = module[methodName];
      return async (...methodArgs) => {
        if (methodsToFlushCacheWith.includes(methodName)) {
          await redis.flushdb();
          return await method.apply(this, methodArgs);
        }
        const cacheKey = `${serviceName}-${methodName}-${JSON.stringify(
          methodArgs
        )}`;
        const cacheResult = await redis.get(cacheKey);
        if (!cacheResult) {
          const result = await method.apply(this, methodArgs);
          await redis.set(cacheKey, JSON.stringify(result));
          return result;
        }

        return JSON.parse(cacheResult);
      };
    },
  };
  return new Proxy(object, handler);
};

const cachedCourseService = cacheMethodCalls("course", courseService, []);
const cachedQuestionService = cacheMethodCalls("question", questionService, [
  "addQuestion",
]);
const cachedAnswerService = cacheMethodCalls("answer", answerService, [
  "addAnswer",
]);

export { cachedCourseService, cachedQuestionService, cachedAnswerService };
