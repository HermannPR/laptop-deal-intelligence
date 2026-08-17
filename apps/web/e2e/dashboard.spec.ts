import { expect, test } from "@playwright/test";

test("renders and filters the personal deal dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /El descuento grita/i })).toBeVisible();
  await expect(page.getByText("VISTA DE DEMOSTRACIÓN")).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });

  await page.getByPlaceholder("Modelo, CPU o GPU").fill("RTX 4050");
  await expect(page.getByText("1 oportunidades bajo análisis")).toBeVisible();
  await expect(page.getByRole("heading", { name: /HP Victus 15/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^OFERTA/i })).toHaveAttribute(
    "href",
    /cyberpuerta\.mx/,
  );
});

test("keeps the dashboard usable on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByPlaceholder("Modelo, CPU o GPU")).toBeVisible();
  await expect(page.getByRole("link", { name: /^OFERTA/i }).first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("opens an evidence-backed laptop price analysis", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "ANALIZAR" }).first().click();
  await expect(page.getByText("OPORTUNIDAD DE PRECIO")).toBeVisible();
  await expect(page.getByRole("heading", { name: /La trayectoria, no la etiqueta/i })).toBeVisible();
  await expect(page.getByRole("img", { name: /Historial de 10 precios observados/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /ABRIR OFERTA/i })).toHaveAttribute(
    "href",
    /cyberpuerta\.mx/,
  );
});
