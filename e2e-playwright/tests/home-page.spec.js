// e2e-playwright/tests/home-page.spec.ts
import { test, expect } from "@playwright/test";

test.describe('Home Page ("/")', () => {
  test("should display the correct page title and heading", async ({
    page,
  }) => {
    // Go to the home page
    await page.goto("/");

    // 1. Check the document title (set in Layout.astro’s <title>)
    await expect(page).toHaveTitle(/Questions and answers/);

    // 2. Check that the main heading "Courses" is visible (from Courses.svelte)
    const coursesHeading = page.locator("h1");
    await expect(coursesHeading).toHaveText("Courses");
  });

  test("should show loading indicator while fetching courses", async ({
    page,
  }) => {
    // Intercept the /api/courses request and delay it
    await page.route("**/api/courses", async (route) => {
      await new Promise((r) => setTimeout(r, 2000)); // Delay 2 seconds
      route.continue();
    });

    await page.goto("/");
    const loadingText = page.locator("text=Loading...");
    await expect(loadingText).toBeVisible({ timeout: 3000 });
  });

  test("should display courses once loaded", async ({ page }) => {
    // Go to the home page
    await page.goto("/");

    // 1. Wait for at least one course link to appear
    // The <Courses> component renders something like:
    //   <a class="hover:text-blue-600 truncate" href="/courses/{course.id}">
    // We can target these links or the parent div for reliability.

    const courseItems = page.locator(
      '.flex.flex-col > div >> a[href^="/courses/"]'
    );

    // Expect at least one course link to eventually appear (assuming our DB has data).
    await expect(courseItems.first()).toBeVisible({ timeout: 5000 });

    // 2. Check that a specific courses are visible
    await expect(
      page.locator("text=Introduction to Programming")
    ).toBeVisible();
    await expect(page.locator("text=Database Design")).toBeVisible();
  });

  test("should toggle user info when clicking the user icon", async ({
    page,
  }) => {
    // Go to the home page
    await page.goto("/");

    // 1. Find the user icon button in the header.
    //    In Header.svelte, we have a <button aria-label="Toggle user info">
    const userInfoToggle = page.locator(
      'button[aria-label="Toggle user info"]'
    );

    // 2. Click the icon to open the user info popup
    await userInfoToggle.click();

    // 3. Verify that user info container appears
    //    The popup is a <div class="absolute right-3 top-14 ..."> in our code
    const userInfoPopup = page.locator("div.absolute.right-3.top-14");
    await expect(userInfoPopup).toBeVisible();

    // 4. Click anywhere on the overlay (the .bg-black/30) to close
    //    In our code, there’s a button that covers the entire overlay
    const overlay = page.locator('button[aria-label="Close user info"]');
    await overlay.click();

    // 5. Ensure the user info container is hidden
    await expect(userInfoPopup).toBeHidden();
  });
});
