import { FastifyInstance } from "fastify";
import { syncFigma } from "../services/scoreService";

const FIGMA_POLL_INTERVAL_MS = 5 * 60 * 1000;
const BETWEEN_TEAM_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startFigmaPoller(app: FastifyInstance): () => void {
  let running = false;

  const runCycle = async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;
    try {
      const teams = await app.prisma.team.findMany({
        select: { id: true }
      });

      for (const team of teams) {
        await syncFigma(app.prisma, team.id);
        await delay(BETWEEN_TEAM_DELAY_MS);
      }
    } catch (error) {
      app.log.error({ error }, "Figma poller cycle failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void runCycle();
  }, FIGMA_POLL_INTERVAL_MS);

  void runCycle();

  return () => {
    clearInterval(timer);
  };
}
