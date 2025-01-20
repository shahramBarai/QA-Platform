// e2e-playwright/tests/llm-answers.spec.ts
import { test, expect } from "@playwright/test";

test.describe("LLM Answers Flow", () => {
  // Adjust to the actual course ID you want to test.
  const COURSE_ID = 1;
  const COURSE_PAGE_URL = `/courses/${COURSE_ID}`;

  test("creates a question on course page, then navigates to question page and sees LLM answers", async ({
    page,
  }) => {
    // 1) Go to the course page
    await page.goto(COURSE_PAGE_URL);

    // 2) Create a unique question
    const uniqueId = Date.now();
    const questionText = `Test question with LLM #${uniqueId}`;

    const questionInput = page.locator('input[type="text"]');
    const createButton = page.locator('button:has-text("Create")');

    await questionInput.fill(questionText);
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // 3) Wait for the newly created question link to appear in the question list.
    //    Typically, our code creates a link: <a href="/questions/123">Test question...</a>
    const newlyCreatedQuestionLink = page.locator(
      'a.hover\\:text-blue-600:has-text("' + questionText + '")'
    );
    await expect(newlyCreatedQuestionLink).toBeVisible({ timeout: 5000 });

    // 4) Extract the questionId from the link's href attribute.
    //    e.g. "/questions/123" => we want "123"
    const hrefValue = await newlyCreatedQuestionLink.getAttribute("href");
    const questionId = hrefValue?.split("/").pop();

    // 5) Navigate to the newly created question’s page
    const questionPageUrl = `/questions/${questionId}`;
    await page.goto(questionPageUrl);

    // 6) Wait for the question heading to appear
    //    e.g. <h1>{question.question}</h1>
    const questionHeading = page.locator("h1", { hasText: questionText });
    await expect(questionHeading).toHaveText(questionText, { timeout: 5000 });

    // 7) Wait for LLM-generated answers to appear.
    //    Suppose our backend automatically creates 3 LLM answers a short time later.
    //    For simplicity, let’s expect exactly 3 if we only rely on LLM.
    await page.waitForTimeout(5000); // Wait for LLM to generate answers (Increase timeout if LLM is slow in your environment)
    await page.reload(); // Restart the page
    const answersContainer = page.locator("div.flex.gap-2.snap-start");
    await expect(answersContainer).toHaveCount(3, { timeout: 10000 });
  });
});
