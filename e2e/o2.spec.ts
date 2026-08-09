import { expect, test } from "@playwright/test";
import { openDemo } from "./helpers";

test.describe("F8-A2 oleada 2 — puerta / ventana / cámara", () => {
  test("demo → puerta → undo", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    await page.evaluate(() => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: { placeDoorOnWall: () => void };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      api.placeDoorOnWall();
    });

    await expect(page.getByTestId("status-meta")).toContainText("doors:1");
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeEnabled();
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByTestId("status-meta")).toContainText("doors:0");
  });

  test("demo → ventana → undo", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    await page.evaluate(() => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: { placeWindowOnWall: () => void };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      api.placeWindowOnWall();
    });

    await expect(page.getByTestId("status-meta")).toContainText("windows:1");
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByTestId("status-meta")).toContainText("windows:0");
  });

  test("demo → cámara → undo", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    await page.evaluate(() => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: {
            placeCamera: (
              eye: { x: number; y: number },
              target: { x: number; y: number },
            ) => void;
          };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      api.placeCamera({ x: 2, y: 2 }, { x: 6, y: 3 });
    });

    await expect(page.getByTestId("status-meta")).toContainText("cameras:1");
    await expect(page.getByTestId("status-msg")).toContainText(/Cámara/i);
    await expect(page.getByRole("button", { name: "Cámara 1" })).toBeVisible();
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByTestId("status-meta")).toContainText("cameras:0");
    await expect(page.getByRole("button", { name: "Cámara 1" })).toHaveCount(0);
    await expect(page.getByText("Sin cámaras")).toBeVisible();
  });
});
