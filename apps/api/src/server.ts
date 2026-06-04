import path from "node:path";
import { buildApiApp } from "./app";

const port = Number(process.env.GAEMIGUARD_API_PORT ?? 4317);
const host = process.env.GAEMIGUARD_API_HOST ?? "127.0.0.1";
const dataDir = process.env.GAEMIGUARD_DATA_DIR ?? path.resolve(process.cwd(), ".gaemiguard-dev");

const app = await buildApiApp({ dataDir });

try {
  await app.listen({ host, port });
  console.log(`GaemiGuard local API listening on http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

