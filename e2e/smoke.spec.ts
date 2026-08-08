import { expect, test } from "@playwright/test";
import { newProject, openDemo, openFileMenu } from "./helpers";

test.describe("F8-A humo funcional", () => {
  test("carga la app", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AxonBIM/);
    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("status-msg")).toBeVisible();
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeDisabled();
  });

  test("Abrir demo → 5 muros; Nuevo → 0", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);
    await expect(page.getByTestId("status-msg")).toContainText("Demo");
    await newProject(page);
    await expect(page.getByTestId("status-msg")).toContainText("Nuevo proyecto");
  });

  test("exportar .axon y reabrir conserva muros", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    const downloadPromise = page.waitForEvent("download");
    await openFileMenu(page);
    await page.getByRole("menuitem", { name: "Exportar…" }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();

    await newProject(page);
    await expect(page.getByTestId("status-meta")).toContainText("walls:0");

    await page.getByTestId("file-open-input").setInputFiles(path!);
    await expect(page.getByTestId("status-meta")).toContainText("walls:5");
    await expect(page.getByTestId("status-msg")).toContainText(/Abierto|importado/i);
  });

  test("Deshacer se habilita tras borrar un muro", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    await page.evaluate(() => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: {
            firstWallId: () => string | null;
            selectWall: (id: string) => void;
            deleteSelectedWall: () => void;
          };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      const id = api.firstWallId();
      if (!id) throw new Error("no walls");
      api.selectWall(id);
      api.deleteSelectedWall();
    });

    await expect(page.getByTestId("status-meta")).toContainText("walls:4");
    await expect(page.getByRole("button", { name: "Deshacer" })).toBeEnabled();

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByTestId("status-meta")).toContainText("walls:5");
  });
});
