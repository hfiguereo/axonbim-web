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

  test("F9-E5 Abrir estricto rechaza; Recuperar salva", async ({ page }) => {
    await page.goto("/");
    await openDemo(page);

    const damaged = await page.evaluate(() => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: { exportText: () => string };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      const data = JSON.parse(api.exportText()) as {
        walls: { id: string }[];
        doors: unknown[];
      };
      const wallId = data.walls[0]?.id;
      if (!wallId) throw new Error("no wall");
      data.doors = [
        {
          id: "door.bad",
          wallId,
          familyId: "family.door-90",
          centerOffset: 1,
          width: 0.9,
          height: 2.1,
          sill: 0,
          hinge: "start",
          swing: "positive",
          // leafState omitted → strict reject
        },
      ];
      return JSON.stringify(data);
    });

    await page.evaluate((text) => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: { openFromText: (t: string, n?: string) => void };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      api.openFromText(text, "roto.axon");
    }, damaged);

    await expect(page.getByTestId("status-msg")).toContainText(/Invalid \.axon file|leafState/i);
    // Strict failure must not wipe the current demo document.
    await expect(page.getByTestId("status-meta")).toContainText("walls:5");

    await page.evaluate((text) => {
      const api = (
        window as unknown as {
          __AXON_E2E__?: { recoverFromText: (t: string, n?: string) => void };
        }
      ).__AXON_E2E__;
      if (!api) throw new Error("__AXON_E2E__ missing");
      api.recoverFromText(text, "copia.axon.bak");
    }, damaged);

    await expect(page.getByTestId("status-msg")).toContainText(/Recuperado/i);
    await expect(page.getByTestId("status-meta")).toContainText("doors:1");
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
