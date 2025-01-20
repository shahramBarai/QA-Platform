import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "10s",
  summaryTrendStats: ["avg", "p(99)"],
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:7800";

export default function () {
  // 1) Request the home page
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    "GET / => 200 OK": (r) => r.status === 200,
  });
  sleep(1);

  // 2) Possibly request other pages, e.g. /courses
  res = http.get(`${BASE_URL}/courses/1`);
  check(res, {
    "GET /courses => 200 OK": (r) => r.status === 200,
  });
  sleep(1);
}
