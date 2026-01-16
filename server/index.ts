import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import { algoDefinitions } from "./algos/registry";
import type { AlgoDefinition, AlgoMeta, AlgoRunResult } from "./algos/types";

const app = Fastify({
  logger: true,
});

app.register(cors, { origin: true });

app.register(swagger, {
  openapi: {
    info: {
      title: "OVOKIT Algo API",
      description: "玩法示例算法接口（demo 用）",
      version: "0.1.0",
    },
  },
});
app.register(swaggerUi, {
  routePrefix: "/docs",
});

const metaFromDefinition = (def: AlgoDefinition<unknown, unknown>): AlgoMeta => ({
  id: def.id,
  name: def.name,
  description: def.description,
  tags: def.tags,
  inputHelp: def.inputHelp,
  inputExample: def.inputExample,
});

app.get("/health", async () => ({ ok: true }));

app.get("/api/algos", async () => {
  return algoDefinitions.map(metaFromDefinition);
});

app.get("/api/algos/:id", async (req, reply) => {
  const id = (req.params as { id: string }).id;
  const def = algoDefinitions.find((d) => d.id === id);
  if (!def) return reply.status(404).send({ error: "Not found" });
  return metaFromDefinition(def);
});

app.post("/api/algos/:id/run", async (req, reply) => {
  const id = (req.params as { id: string }).id;
  const def = algoDefinitions.find((d) => d.id === id);
  if (!def) return reply.status(404).send({ error: "Not found" });

  const parseResult = def.inputSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return reply.status(400).send({ error: "Invalid input", issues });
  }

  const start = performance.now();
  const output = await def.run(parseResult.data);
  const durationMs = Math.round(performance.now() - start);
  const result: AlgoRunResult<unknown> = {
    output,
    durationMs,
  };

  return reply.send(result);
});

const port = Number(process.env.ALGO_PORT || 4000);
const host = process.env.ALGO_HOST || "0.0.0.0";

async function start() {
  try {
    await app.listen({ port, host });
    app.log.info(`Algo API listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
