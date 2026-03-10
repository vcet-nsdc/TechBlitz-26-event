import { FastifyPluginAsync } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

const swaggerPlugin: FastifyPluginAsync = async (app) => {
  if (process.env.NODE_ENV === "production") return;

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "Hackathon 2025 API", version: "1.0.0" },
      servers: [{ url: process.env.FRONTEND_URL ?? "http://localhost:4000" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
        }
      }
    }
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: "/docs"
  });
};

export default swaggerPlugin;
