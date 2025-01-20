import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:7800/api";

// The setup() function is called once before the test starts.
export function setup() {
  // 1) Create one user for rate-limiting tests
  let createUserRes = http.post(`${BASE_URL}/users`, JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
  check(createUserRes, {
    "POST /users (answerFlow) => 200": (r) => r.status === 200,
  });

  if (createUserRes.status !== 200) {
    console.error("Failed to create user for answerFlow:", createUserRes.body);
    return;
  }

  const userUuid = JSON.parse(createUserRes.body).uuid;

  // 3) Create one question for course #1 that all answerFlow VUs will reuse
  const questionText = `setup question - ${randomString(6)}`;
  let createQuestionRes = http.post(
    `${BASE_URL}/courses/1/questions`,
    JSON.stringify({ question: questionText, userUuid: userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  // 4) Check question creation was successful
  check(createQuestionRes, {
    "POST /courses/1/questions (setup) => 200": (r) => r.status === 200,
  });

  // 5) Parse the question ID from the response
  let questionData = null;
  if (createQuestionRes.status === 200) {
    try {
      questionData = JSON.parse(createQuestionRes.body);
    } catch (err) {
      console.error("Error parsing question data in setup():", err);
    }
  }

  // 6) Return both questionId and userUuid
  if (questionData && questionData.id && userUuid) {
    return { questionId: questionData.id, userUuid };
  }

  // Return null if setup failed
  return null;
}

// We define multiple scenarios in `options.scenarios`.
export const options = {
  scenarios: {
    // 1. "Courses" scenario: repeatedly fetch courses
    testCourses: {
      executor: "constant-arrival-rate",
      rate: 5, // 5 iterations/requests per timeUnit
      timeUnit: "1s",
      duration: "20s", // total time for this scenario
      preAllocatedVUs: 5, // pre-allocate up to 5 VUs
      exec: "courseFlow", // function that this scenario will call
    },
    // 2. "Users" scenario: ramp up from 1 to 5 iterations/sec over 20s,
    //    then ramp down, for creating/fetching users
    testUsers: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      stages: [
        { target: 5, duration: "20s" },
        { target: 0, duration: "10s" },
      ],
      preAllocatedVUs: 5,
      exec: "userFlow",
    },
    // 3. "Questions" scenario: a simple shared-iterations approach,
    //    e.g., we want 20 total question-based iterations, distributed among up to 5 VUs
    testQuestions: {
      executor: "shared-iterations",
      vus: 5,
      iterations: 20,
      exec: "questionFlow",
    },
    // 4. "Answers" scenario: again a constant-arrival-rate to test answer creation/fetching
    testAnswers: {
      executor: "constant-arrival-rate",
      rate: 3,
      timeUnit: "1s",
      duration: "20s",
      preAllocatedVUs: 5,
      exec: "answerFlow",
    },
    // 5. "Questions & Answers" scenario: a ramping-arrival-rate for creating a question and its answer
    testQuestionsAnswers: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      stages: [
        { target: 5, duration: "20s" },
        { target: 0, duration: "10s" },
      ],
      preAllocatedVUs: 5,
      exec: "questionAnswerFlow",
    },
    // 6. "Rate Limit Test" scenario: test the rate-limiting functionality
    rateLimitTest: {
      executor: "constant-arrival-rate",
      rate: 2, // 2 iterations/requests per second
      timeUnit: "1s",
      duration: "120s", // run for 2 minutes to cover the rate limit window
      preAllocatedVUs: 2, // allocate 2 VUs for this scenario
      exec: "rateLimitFlow", // function that this scenario will call
      tags: { scenario: "rateLimitTest" },
    },
  },
  summaryTrendStats: ["avg", "p(99)"],
  thresholds: {
    // e.g., 95% of requests < 1000ms
    http_req_duration: ["p(95) < 1000"],
  },
};

/**
 * Scenario 1: courseFlow()
 * Repeatedly gets the list of courses and fetches a random course by ID.
 */
export function courseFlow() {
  // 1) GET /courses
  let res = http.get(`${BASE_URL}/courses`);
  check(res, {
    "GET /courses => 200 OK": (r) => r.status === 200,
  });
  // 2) GET /courses/:courseId
  // pick from the JSON in res.body
  const randomId = JSON.parse(res.body)[0].id;
  res = http.get(`${BASE_URL}/courses/${randomId}`);
  check(res, {
    [`GET /courses/${randomId} => 200 OK`]: (r) => r.status === 200,
  });
  sleep(1);
}

/**
 * Scenario 2: userFlow()
 * Creates a user, then fetches it back. Repeat.
 */
export function userFlow() {
  // 1) POST /users
  let res = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({}), // or pass any data if the endpoint needs it
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  check(res, {
    "POST /users => success": (r) => r.status >= 200 && r.status < 300,
  });
  // If successful, parse the body to get user data
  if (res.status < 300) {
    const userData = JSON.parse(res.body);
    const userId = userData.uuid;

    // 2) GET /users/:userId
    res = http.get(`${BASE_URL}/users/${userId}`);
    check(res, {
      [`GET /users/${userId} => 200 OK`]: (r) => r.status === 200,
    });
  }
  sleep(1);
}

/**
 * Scenario 3: questionFlow()
 * 1) Creates a new user for posting a question.
 * 2) Posts a question to course #1.
 * 3) Fetches the question back.
 */
export function questionFlow() {
  // 1) Create a new user for posting an answer
  let createUserRes = http.post(`${BASE_URL}/users`, JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
  check(createUserRes, {
    "POST /users (answerFlow) => 200": (r) => r.status === 200,
  });

  if (createUserRes.status !== 200) {
    console.error("Failed to create user for answerFlow:", createUserRes.body);
    return;
  }

  const userUuid = JSON.parse(createUserRes.body).uuid;

  // 2) Create a question. Suppose we have a known course ID = 1.
  const questionTxt = `k6 question - ${randomString(6)}`;
  let res = http.post(
    `${BASE_URL}/courses/1/questions`,
    JSON.stringify({ question: questionTxt, userUuid: userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, {
    "POST /courses/1/questions => success": (r) => r.status === 200,
  });

  if (res.status === 200) {
    let questionData;
    try {
      questionData = JSON.parse(res.body);
    } catch (e) {
      console.error("Failed to parse question data:", e);
    }

    if (questionData && questionData.id) {
      const questionId = questionData.id;
      // 3) GET /questions/:questionId
      res = http.get(`${BASE_URL}/questions/${questionId}`);
      check(res, {
        [`GET /questions/${questionId} => 200 OK`]: (r) => r.status === 200,
      });
    }
  }
  sleep(1);
}

/**
 * Scenario 4: answerFlow()
 * 0) Reuses the questionId from setup()
 * 1) Creates a new user for posting
 * 2) Posts an answer to the question.
 * 3) Fetches the list of answers for that question.
 */
export function answerFlow(setupData) {
  // 0) Check if we have the questionId from setup()
  if (!setupData || !setupData.questionId) {
    console.error("No questionId from setup(); skipping answerFlow.");
    return;
  }

  // 1) Create a new user for posting an answer
  let createUserRes = http.post(`${BASE_URL}/users`, JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
  check(createUserRes, {
    "POST /users (answerFlow) => 200": (r) => r.status === 200,
  });

  if (createUserRes.status !== 200) {
    console.error("Failed to create user for answerFlow:", createUserRes.body);
    return;
  }

  const userUuid = JSON.parse(createUserRes.body).uuid;
  const questionId = setupData.questionId;
  // 2) Post an answer to the question
  const answerTxt = `k6 answer - ${randomString(4)}`;
  let postAnswerRes = http.post(
    `${BASE_URL}/questions/${questionId}/answers`,
    JSON.stringify({ answer: answerTxt, userUuid: userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(postAnswerRes, {
    [`POST /questions/${questionId}/answers => 200`]: (r) => r.status === 200,
  });

  // 3) GET the answers for this question
  let getAnswersRes = http.get(
    `${BASE_URL}/questions/${questionId}/answers?offset=0&limit=20`
  );
  check(getAnswersRes, {
    [`GET /questions/${questionId}/answers => 200`]: (r) => r.status === 200,
  });

  sleep(1);
}

/**
 * Scenario 5: questionAnswerFlow()
 * 1) Creates a new user for posting
 * 2) Creates a question for course #1
 * 3) Posts an answer to the newly created question.
 * 4) Fetches the list of answers for that question.
 */
export function questionAnswerFlow() {
  // 1) Create a new user for posting
  let createUserRes = http.post(`${BASE_URL}/users`, JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
  check(createUserRes, {
    "POST /users (answerFlow) => 200": (r) => r.status === 200,
  });

  if (createUserRes.status !== 200) {
    console.error("Failed to create user for answerFlow:", createUserRes.body);
    return;
  }

  const userUuid = JSON.parse(createUserRes.body).uuid;

  // Step 1: Create a question
  const questionText = `k6 question (for answer) - ${randomString(6)}`;
  let createQuestionRes = http.post(
    `${BASE_URL}/courses/1/questions`,
    JSON.stringify({ question: questionText, userUuid: userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(createQuestionRes, {
    "POST /courses/1/questions => 200": (r) => r.status === 200,
  });

  if (createQuestionRes.status !== 200) {
    // If question creation failed, skip the rest
    console.error(
      "Failed to create question for answerFlow:",
      createQuestionRes.body
    );
    return;
  }

  // Parse out the newly created question ID
  let questionData;
  try {
    questionData = JSON.parse(createQuestionRes.body);
  } catch (e) {
    console.error("Failed to parse question creation response:", e);
    return;
  }

  if (!questionData || !questionData.id) {
    console.error(
      "No question ID returned from creation:",
      createQuestionRes.body
    );
    return;
  }
  const questionId = questionData.id;

  // Step 2: Post an answer to that newly created question
  const answerText = `k6 answer - ${randomString(4)}`;
  let postAnswerRes = http.post(
    `${BASE_URL}/questions/${questionId}/answers`,
    JSON.stringify({ answer: answerText, userUuid: userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(postAnswerRes, {
    [`POST /questions/${questionId}/answers => 200`]: (r) => r.status === 200,
  });
  if (postAnswerRes.status !== 200) {
    console.error("Failed to post answer:", postAnswerRes.body);
    return;
  }

  // Step 3: GET the answers for this question
  let getAnswersRes = http.get(
    `${BASE_URL}/questions/${questionId}/answers?offset=0&limit=20`
  );
  check(getAnswersRes, {
    [`GET /questions/${questionId}/answers => 200`]: (r) => r.status === 200,
  });

  sleep(1);
}

/**
 * Scenario 6: rateLimitFlow()
 * Attempts to post multiple questions and answers from the same user to test rate limiting.
 */
export function rateLimitFlow(setupData) {
  // Ensure setupData contains userUuid
  if (!setupData || !setupData.userUuid) {
    console.error("No userUuid from setup(); skipping rateLimitTest.");
    return;
  }

  const userUuid = setupData.userUuid;

  // 1) Attempt to post a question
  const questionTxt = `k6 rate limit question - ${randomString(6)}`;
  let postQuestionRes = http.post(
    `${BASE_URL}/courses/1/questions`,
    JSON.stringify({ question: questionTxt, userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Check if the first question post is accepted
  check(postQuestionRes, {
    "POST /courses/1/questions => 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
  });

  // 2) Attempt to post another question immediately
  let postQuestionRes2 = http.post(
    `${BASE_URL}/courses/1/questions`,
    JSON.stringify({ question: questionTxt, userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Check if the second question post is rejected due to rate limiting
  check(postQuestionRes2, {
    "POST /courses/1/questions rate limit => 429": (r) => r.status === 429,
  });

  // 3) Attempt to post an answer
  const answerTxt = `k6 rate limit answer - ${randomString(6)}`;
  let postAnswerRes = http.post(
    `${BASE_URL}/questions/${setupData.questionId}/answers`,
    JSON.stringify({ answer: answerTxt, userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Check if the first answer post is accepted
  check(postAnswerRes, {
    "POST /questions/:id/answers => 200 or 429": (r) =>
      r.status === 200 || r.status === 429,
  });

  // 4) Attempt to post another answer immediately
  let postAnswerRes2 = http.post(
    `${BASE_URL}/questions/${setupData.questionId}/answers`,
    JSON.stringify({ answer: answerTxt, userUuid }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Check if the second answer post is rejected due to rate limiting
  check(postAnswerRes2, {
    "POST /questions/:id/answers rate limit => 429": (r) => r.status === 429,
  });

  sleep(1);
}
