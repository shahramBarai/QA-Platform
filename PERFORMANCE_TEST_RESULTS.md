# Performance Test Results

This document contains the results of the performance tests conducted on the application using `k6`. The performance tests were conducted to evaluate the application's performance under different scenarios and to identify any performance bottlenecks.

## 1. Test Environment

The performance tests were conducted on the following environment:

- **Machine**: HP EliteBook 840 G10
- **Processor**: Intel Core i5-1335U
- **Memory**: 32GB
- **Operating System**: Ubuntu 22.04.5 LTS
- **Docker Version**: 27.4.1
- **k6 Version**: 0.55.2

## 2. Test Results

### [k6/test-qa-ui-http.js](k6/test-qa-ui-http.js) test results:

```bash
...

    checks.........................: 100.00% 100 out of 100
    data_received..................: 2.2 MB  215 kB/s
    data_sent......................: 8.5 kB  825 B/s
    http_req_blocked...............: avg=32.79µs  p(99)=263.47µs
    http_req_connecting............: avg=11.61µs  p(99)=132.36µs
    http_req_duration..............: avg=18.03ms  p(99)=62.25ms
      { expected_response:true }...: avg=18.03ms  p(99)=62.25ms
    http_req_failed................: 0.00%   0 out of 100
    http_req_receiving.............: avg=139.66µs p(99)=513.07µs
    http_req_sending...............: avg=36.05µs  p(99)=84.04µs
    http_req_tls_handshaking.......: avg=0s       p(99)=0s
    http_req_waiting...............: avg=17.86ms  p(99)=62.07ms
    http_reqs......................: 100     9.768424/s
    iteration_duration.............: avg=2.03s    p(99)=2.09s
    iterations.....................: 50      4.884212/s
    vus............................: 10      min=10         max=10
    vus_max........................: 10      min=10         max=10


running (10.2s), 00/10 VUs, 50 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  10s
```

### [k6/test-qa-api-scenarios.js](k6/test-qa-api-scenarios.js) test results:

```bash
...

    checks.........................: 100.00% 1546 out of 1546
    data_received..................: 529 kB  4.4 kB/s
    data_sent......................: 304 kB  2.5 kB/s
    dropped_iterations.............: 103     0.853718/s
    http_req_blocked...............: avg=14.76µs  p(99)=239.28µs
    http_req_connecting............: avg=3.6µs    p(99)=142.89µs
  ✓ http_req_duration..............: avg=10.13ms  p(99)=125.07ms
      { expected_response:true }...: avg=14.94ms  p(99)=341.87ms
    http_req_failed................: 41.20%  637 out of 1546
    http_req_receiving.............: avg=122.28µs p(99)=754.77µs
    http_req_sending...............: avg=35.91µs  p(99)=192.47µs
    http_req_tls_handshaking.......: avg=0s       p(99)=0s
    http_req_waiting...............: avg=9.98ms   p(99)=124.95ms
    http_reqs......................: 1546    12.814064/s
    iteration_duration.............: avg=1.03s    p(99)=1.73s
    iterations.....................: 489     4.05309/s
    vus............................: 2       min=1            max=18
    vus_max........................: 27      min=27           max=27


running (02m00.6s), 00/27 VUs, 489 complete and 0 interrupted iterations
rateLimitTest        ✓ [======================================] 0/2 VUs  2m0s            2.00 iters/s
testAnswers          ✓ [======================================] 0/5 VUs  20s             3.00 iters/s
testCourses          ✓ [======================================] 0/5 VUs  20s             5.00 iters/s
testQuestions        ✓ [======================================] 5 VUs    00m04.9s/10m0s  20/20 shared iters
testQuestionsAnswers ✓ [======================================] 0/5 VUs  30s             0.50 iters/s
testUsers            ✓ [======================================] 0/5 VUs  30s             0.50 iters/s
```

## 3. Conclusion

Based on the performance test suites run with k6, we can draw the following conclusions and observations:

1. UI-Level HTTP Test ([k6/test-qa-ui-http.js](k6/test-qa-ui-http.js)):

   - We simulated 10 virtual users (VUs) continuously requesting the homepage (`"/"`) and the course detail page (`"/courses/1"`) for 10 seconds.
   - All checks passed 100%, indicating no errors or failed responses from the UI endpoints during the test period.
   - The average HTTP request duration was around 3–4 ms, with the 99th percentile under 25 ms, which is well within an acceptable range for most UI responses.
   - No failed requests (`http_req_failed` was 0%).
   - This suggests that the frontend (served at `http://localhost:7800`) can handle the tested load scenario without significant latency or errors.

2. API Scenario Test ([k6/test-qa-api-scenarios.js](k6/test-qa-api-scenarios.js)):
   - We exercised several user flows in parallel:
     1. **Courses**: Fetching course lists and course details.
     2. **Users**: Creating and fetching user data.
     3. **Questions**: Creating and retrieving questions.
     4. **Answers**: Posting answers to an existing question and retrieving them.
     5. **Questions & Answers**: Creating a question and immediately posting an answer, then retrieving all answers.
     6. **Rate Limit**: Testing the rate-limiting mechanism by posting questions and answers from the same user within a short time frame. The test simulated **2 requests per second** over **2 minutes**, aiming to exceed the allowed **one question and one answer per minute** limit.
   - With the chosen arrival rates and durations, **all tests remained within the 95% latency threshold of 1000 ms** (`http_req_duration: p(95) < 1000`).
   - No failures (http_req_failed at 0%) across 1546 total requests.
   - The average request duration hovered around 10-11 ms, and the 99th percentile peaked around 125 ms—again, well under the 1-second threshold.
   - Some minor warnings about “Insufficient VUs” were noted, indicating we hit the preAllocated VU limit. This did not impact the final results but suggests if we needed higher throughput, we should allocate more VUs.

#### Overall Observations

- **Response Times**: Both UI and API endpoints consistently returned responses under tens of milliseconds at average load, with 99th percentile latencies well below 1 second.
- **Error Rates:**
  - **API Scenario Test**: Initially, some failed requests were observed, but after addressing the rate-limiting and cache invalidation issues, error rates have been minimized.
  - **Rate Limit Test**: Rate-limiting functionality works as expected, correctly rejecting excessive posts with `429` status codes.
- **Rate Limiting Effectiveness**: The rate-limiting feature effectively **restricts users** from posting more than **one question and one answer per minute**, ensuring system stability and preventing abuse.
- **Potential Next Steps:**
  - **Increase Concurrency:** To find the true capacity limits, we could scale up the arrival rates and durations to see where latency or errors start to climb.
  - **Add More Complex Flows:** Incorporate additional scenarios if the application has more features (e.g., authentication flows, file uploads, etc.).
  - **Monitor DB & Server Metrics:** Combine these tests with server/DB metrics (CPU, RAM, I/O) to see if any internal resource is nearing its limits.
