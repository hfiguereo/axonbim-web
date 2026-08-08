import { expect, test } from "@playwright/test";
import { canvasMask, openDemo } from "./helpers";

test.describe("F8-B capturas UI (canvas enmascarado)", () => {
  test("proyecto vacío — layout", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page).toHaveScreenshot("shell-empty.png", {
      mask: canvasMask(page),
      fullPage: true,
    });
  });

  test("demo abierta — layout", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);
    await expect(page.getByTestId("status-meta")).toContainText("walls:5");
    await expect(page).toHaveScreenshot("shell-demo.png", {
      mask: canvasMask(page),
      fullPage: true,
    });
  });
});
