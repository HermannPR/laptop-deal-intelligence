import { expect, test } from "@playwright/test";

test("renders and filters the personal deal dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /El descuento grita/i })).toBeVisible();
  await expect(page.getByText("VISTA DE DEMOSTRACIÓN")).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });

  await page.getByPlaceholder("Modelo, CPU o GPU").fill("RTX 4050");
  await expect(page.getByText("1 oportunidades bajo análisis")).toBeVisible();
  await expect(page.getByRole("heading", { name: /HP Victus 15/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /VER OFERTA/i })).toHaveAttribute(
    "href",
    /cyberpuerta\.mx/,
  );
});

test("keeps the dashboard usable on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByPlaceholder("Modelo, CPU o GPU")).toBeVisible();
  await expect(page.getByRole("link", { name: /VER OFERTA/i }).first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
