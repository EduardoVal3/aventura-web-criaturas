import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = join(__dirname, "../../..");

test("Despliegue gratuito (Cloudflare Pages + Render Free): manifiestos y SPA listos", () => {
  assert.strictEqual(existsSync(join(RAIZ_REPO, ".node-version")), true);
  assert.strictEqual(existsSync(join(RAIZ_REPO, "render.yaml")), true);

  // Cloudflare Pages activa enrutamiento SPA automático cuando no existe 404.html en public/
  assert.strictEqual(existsSync(join(RAIZ_REPO, "apps/web/public/404.html")), false);

  const apiHttpCodigo = readFileSync(join(__dirname, "../src/api/apiHttp.ts"), "utf-8");
  assert.ok(apiHttpCodigo.includes('.replace(/\\/+$/, "")'));

  const pkgApi = JSON.parse(
    readFileSync(join(RAIZ_REPO, "apps/api/package.json"), "utf-8"),
  ) as { scripts: Record<string, string> };
  assert.strictEqual(pkgApi.scripts["start:prod"], "node dist/src/main");
  assert.ok(pkgApi.scripts["build"].includes("prisma generate"));
  assert.ok(pkgApi.scripts["arranque:nube"].includes("inicializar-nube.js"));
});
