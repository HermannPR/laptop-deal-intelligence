import { expect, test } from "@playwright/test";

test("renders and filters the analyst dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Oportunidades actuales" })).toBeVisible();
  await expect(page.getByText(/Datos de demostración/)).toBeVisible();
  await expect(page.getByLabel("Orden")).toHaveValue("bang");
  await expect(page.getByLabel("Procesador")).toBeVisible();
  await expect(page.getByLabel("Solo NVIDIA RTX")).toBeChecked();
  await page.getByLabel("Procesador").selectOption({ label: "AMD Ryzen 5 8645HS" });
  await expect(page.getByLabel("Procesador")).toHaveValue("AMD Ryzen 5 8645HS");
  await page.getByRole("button", { name: "Limpiar" }).click();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });

  await page.getByPlaceholder("Buscar modelo, CPU, GPU o SKU").fill("RTX 4050");
  await expect(page.getByText("1 resultados · precio efectivo en MXN")).toBeVisible();
  await expect(page.getByRole("heading", { name: /HP Victus 15/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Tienda/i })).toHaveAttribute("href", /cyberpuerta\.mx/);
});

test("keeps the dashboard usable on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByPlaceholder("Buscar modelo, CPU, GPU o SKU")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Tienda/i }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("opens an evidence-backed laptop analysis", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Analizar" }).first().click();
  await expect(page.getByText("Oportunidad de precio", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Precio a través del tiempo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Qué significa Bang for Buck" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Alternativas dentro de/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Historial de 10 precios observados/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir oferta/i })).toHaveAttribute("href", /cyberpuerta\.mx/);
});
