import { cachedCourseService } from "../util/cacheUtil.js";

const getListOfCourses = async (req) => {
  const courses = await cachedCourseService.findAll();
  return Response.json(courses);
};

const getCourseById = async (req, urlPatternResult) => {
  const courseId = urlPatternResult.pathname.groups.courseId;
  const course = await cachedCourseService.findById(courseId);
  return Response.json(course);
};

export { getListOfCourses, getCourseById };
