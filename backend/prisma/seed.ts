import bcrypt from "bcrypt";
import { Domain, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CriteriaSeed = {
  name: string;
  maxScore: number;
  weight: number;
};

const DOMAIN_CRITERIA: Record<Domain, CriteriaSeed[]> = {
  UIUX: [
    { name: "Visual Design", maxScore: 30, weight: 0.3 },
    { name: "UX Flow", maxScore: 25, weight: 0.25 },
    { name: "Prototype Quality", maxScore: 25, weight: 0.25 },
    { name: "Innovation", maxScore: 20, weight: 0.2 }
  ],
  AGENTIC_AI: [
    { name: "AI Integration", maxScore: 30, weight: 0.3 },
    { name: "Technical Depth", maxScore: 25, weight: 0.25 },
    { name: "Functionality", maxScore: 25, weight: 0.25 },
    { name: "Innovation", maxScore: 20, weight: 0.2 }
  ],
  VIBE_CODING: [
    { name: "Code Quality", maxScore: 25, weight: 0.25 },
    { name: "Feature Completeness", maxScore: 30, weight: 0.3 },
    { name: "Creativity", maxScore: 25, weight: 0.25 },
    { name: "Demo", maxScore: 20, weight: 0.2 }
  ]
};

export async function seedDatabase(db: PrismaClient): Promise<void> {
  await db.score.deleteMany();
  await db.promptLog.deleteMany();
  await db.submission.deleteMany();
  await db.participant.deleteMany();
  await db.team.deleteMany();
  await db.judgeLab.deleteMany();
  await db.judge.deleteMany();
  await db.lab.deleteMany();
  await db.scoreCriteria.deleteMany();
  await db.leaderboardEntry.deleteMany();
  await db.eventConfig.deleteMany();

  await db.eventConfig.create({
    data: { id: 1, phase: "REGISTRATION" }
  });

  const domainOrder: Domain[] = ["UIUX", "AGENTIC_AI", "VIBE_CODING"];
  const passwordHash = await bcrypt.hash("judge12345", 10);
  const labsByDomain = new Map<Domain, { id: string; name: string }[]>();

  for (const domain of domainOrder) {
    const labs: { id: string; name: string }[] = [];
    for (let i = 1; i <= 3; i += 1) {
      const createdLab = await db.lab.create({
        data: {
          name: `${domain.replace("_", " ")} Lab ${i}`,
          domain
        }
      });
      labs.push({ id: createdLab.id, name: createdLab.name });
    }
    labsByDomain.set(domain, labs);
  }

  let teamCounter = 1;
  for (const domain of domainOrder) {
    const labs = labsByDomain.get(domain) ?? [];
    for (const lab of labs) {
      for (let t = 1; t <= 4; t += 1) {
        const team = await db.team.create({
          data: {
            name: `${domain.toLowerCase()}-team-${teamCounter}`,
            domain,
            labId: lab.id
          }
        });

        for (let p = 1; p <= 3; p += 1) {
          await db.participant.create({
            data: {
              name: `Participant ${teamCounter}-${p}`,
              email: `participant${teamCounter}${p}@hackathon.dev`,
              teamId: team.id
            }
          });
        }
        teamCounter += 1;
      }
    }
  }

  let judgeCounter = 1;
  for (const domain of domainOrder) {
    const labs = labsByDomain.get(domain) ?? [];
    for (const lab of labs) {
      for (let j = 1; j <= 2; j += 1) {
        const judge = await db.judge.create({
          data: {
            name: `Judge ${judgeCounter}`,
            email: `judge${judgeCounter}@hackathon.dev`,
            passwordHash,
            domain
          }
        });

        await db.judgeLab.create({
          data: {
            judgeId: judge.id,
            labId: lab.id
          }
        });
        judgeCounter += 1;
      }
    }
  }

  const adminJudge = await db.judge.create({
    data: {
      name: "Admin User",
      email: "admin@hackathon.dev",
      passwordHash,
      domain: "UIUX"
    }
  });

  const allLabs = await db.lab.findMany({ select: { id: true } });
  for (const lab of allLabs) {
    await db.judgeLab.create({
      data: {
        judgeId: adminJudge.id,
        labId: lab.id
      }
    });
  }

  for (const domain of domainOrder) {
    const criteria = DOMAIN_CRITERIA[domain];
    for (const criterion of criteria) {
      await db.scoreCriteria.create({
        data: {
          domain,
          name: criterion.name,
          maxScore: criterion.maxScore,
          weight: criterion.weight,
          isFinal: false
        }
      });

      await db.scoreCriteria.create({
        data: {
          domain,
          name: criterion.name,
          maxScore: criterion.maxScore,
          weight: criterion.weight,
          isFinal: true
        }
      });
    }
  }
}

async function main(): Promise<void> {
  await seedDatabase(prisma);
}

if (require.main === module) {
  main()
    .then(async () => prisma.$disconnect())
    .catch(async (err) => {
      console.error("Seeding failed", err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
