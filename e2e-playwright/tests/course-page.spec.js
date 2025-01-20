// e2e-playwright/tests/course-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Course Page", () => {
  // We’ll test courseId = 1. Adjust or parameterize as needed.
  const COURSE_ID = 1;
  const COURSE_NAME = "Introduction to Programming";
  const COURSE_URL = `/courses/${COURSE_ID}`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the course page before each test
    await page.goto(COURSE_URL);
  });

  test("displays breadcrumb", async ({ page }) => {
    // Find the NavBar container:
    const navBar = page.locator("div.pb-4.flex.gap-4");
    await expect(navBar).toContainText("Courses");
    // Also check it has the course name:
    await expect(navBar).toContainText(COURSE_NAME); // or whatever the course name is
  });

  test("displays correct course name", async ({ page }) => {
    // 1. Check the main heading for the course name
    const heading = page.locator("h1", { hasText: COURSE_NAME });
    await expect(heading).toBeVisible();

    // 2. Check the course name
    await expect(heading).toHaveText(COURSE_NAME);
  });

  test("shows a create question form and a list of questions", async ({
    page,
  }) => {
    // 1. Check that the question input and "Create" button appear
    const questionInput = page.locator('input[type="text"]');
    const createButton = page.locator('button:has-text("Create")');

    await expect(questionInput).toBeVisible();
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeDisabled(); // Should be disabled if input is empty

    // 2. The "Questions" heading or some container for questions
    const questionsHeading = page.locator("h2", { hasText: "Questions" });
    await expect(questionsHeading).toContainText("Questions");

    // 3. Check if there are any existing questions in the list (if seeded).
    //    By default, we have a <div> with .flex.flex-col > each .border rounded-lg
    const questionItems = page.locator("div.border.rounded-lg");
    // We don’t know if it’s empty or not, so we’ll just check it’s at least visible.
    // If no questions exist, it might show "No questions available".
    const noQuestionsText = page.locator("text=No questions available");
    if (await noQuestionsText.isVisible({ timeout: 2000 })) {
      // Environment might have no existing questions
      await expect(noQuestionsText).toBeVisible();
    } else {
      // Otherwise, we should see at least one question item
      await expect(questionItems.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("allows creating a new question", async ({ page }) => {
    // 1. Type a question into the input
    const questionText = `What is the best way to learn infinite scrolling? (${Date.now()})`;
    const questionInput = page.locator('input[type="text"]');
    const createButton = page.locator('button:has-text("Create")');

    await questionInput.fill(questionText);
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // 2. After creating, the component resets `questions` and reloads them.
    //    We expect the new question to appear in the list.
    //    The link for a question is in an <a href="/questions/{question.id}"> with the question text
    //    We can wait for the new text to appear.
    const newlyAddedQuestion = page.locator(`text=${questionText}`);
    await expect(newlyAddedQuestion).toBeVisible({ timeout: 3000 });
  });

  test("handles infinite scrolling to load additional questions", async ({
    page,
  }) => {
    // If our environment has more than 20 questions for this course,
    // the component calls loadMoreQuestions() as the user scrolls.
    const questionItems = page.locator("div.border.rounded-lg");

    // 1. Scroll container
    // We have a container with class `h-[500px] overflow-y-auto snap-y`:
    const scrollContainer = page.locator("div.h-\\[500px\\].overflow-y-auto");

    // 2. If we don’t know how many total questions are in our environment, we could just check
    // that more questions appear after scrolling.
    const initialCount = await questionItems.count();
    // Scroll again
    await scrollContainer.evaluate((elem) => {
      elem.scrollTop = elem.scrollHeight;
    });
    await page.waitForTimeout(2000); // Wait a bit for loading

    const finalCount = await questionItems.count();

    // Expect finalCount > initialCount if more are loaded
    // (In a real environment, we might have fewer than 20 total, so handle that possibility.)
    if (initialCount < 20) {
      // We might already have loaded all questions if there were fewer than 20.
      // So, finalCount could be the same as initialCount. That’s okay.
      // This test might pass trivially if we’re in a small DB scenario.
      test.skip(
        initialCount < 20,
        "Not enough questions to test infinite scroll."
      );
    } else {
      expect(finalCount).toBeGreaterThan(initialCount);
    }
  });

  test("allows liking and unliking a question", async ({ page }) => {
    // This test expects that there is at least one question visible in the list.
    const firstQuestion = page.locator("div.border.rounded-lg").first();

    // 1. Find the LikeButton inside that question.
    const likeButton = firstQuestion.locator("button:has(svg)");

    // 2. Read the current like count
    let initialCountText = await likeButton.innerText();
    let initialCount = parseInt(initialCountText, 10) || 0;

    // 3. Click to like (if not already liked)
    if (initialCountText.includes("fill-current")) {
      // Possibly it’s already liked by the user. Let’s handle that scenario by unliking first.
      await likeButton.click();
      await page.waitForTimeout(500); // small wait
      initialCountText = await likeButton.innerText();
      initialCount = parseInt(initialCountText, 10) || 0;
    }

    // Now we know we’re in an unliked state. Like it:
    await likeButton.click();
    await page.waitForTimeout(500); // Wait a moment for fetch + re-render

    // 4. Expect the count to have incremented by 1
    let afterLikeText = await likeButton.innerText();
    const afterLikeCount = parseInt(afterLikeText, 10) || 0;
    expect(afterLikeCount).toBe(initialCount + 1);

    // 5. Click again to unlike
    await likeButton.click();
    await page.waitForTimeout(500);

    // 6. Expect the count to return to the original
    let afterUnlikeText = await likeButton.innerText();
    const afterUnlikeCount = parseInt(afterUnlikeText, 10) || 0;
    expect(afterUnlikeCount).toBe(initialCount);
  });
});
