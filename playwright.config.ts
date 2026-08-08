import { defineConfig, devices } from "@playwright/test";

/**
 * F8 oleada 1 — humo funcional (A) + capturas UI enmascarando canvas (B).
 * Local only; CI no autorizado aún.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      // UI chrome; canvas masked. Allow tiny font/AA drift.
      maxDiffPixelRatio: 0.03,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    locale: "es-ES",
    colorScheme: "dark",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm --filter @axonbim/web dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    // Do not reuse a stray `pnpm dev` — stale servers caused F8 timeouts on file-menu.
    // Opt-in: PW_REUSE=1 pnpm test:e2e
    reuseExistingServer: process.env.PW_REUSE === "1",
    timeout: 120_000,
  },
});
