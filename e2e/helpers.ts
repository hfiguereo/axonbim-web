import { expect, type Page } from "@playwright/test";

export async function openFileMenu(page: Page): Promise<void> {
  await page.getByTestId("file-menu").click();
  await expect(page.getByRole("menu", { name: "Archivo" })).toBeVisible();
}

export async function openDemo(page: Page): Promise<void> {
  await openFileMenu(page);
  await page.getByRole("menuitem", { name: "Abrir demo" }).click();
  await expect(page.getByTestId("status-meta")).toContainText("walls:5");
}

export async function newProject(page: Page): Promise<void> {
  await openFileMenu(page);
  await page.getByRole("menuitem", { name: "Nuevo" }).click();
  await expect(page.getByTestId("status-meta")).toContainText("walls:0");
}

/** Canvas WebGL is masked — visual tests cover chrome/layout, not mesh pixels. */
export function canvasMask(page: Page) {
  return [page.locator("canvas")];
}
