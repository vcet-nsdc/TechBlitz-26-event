import bcrypt from "bcrypt";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { Resend } from "resend";
import { AuthError, NotFoundError, InternalError } from "../../lib/errors";
import { redisKeys } from "../../lib/redis";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const participantMagicLinkSchema = z.object({
  email: z.string().email()
});

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 }
          }
        }
      }
    },
    async (request) => {
      const payload = loginSchema.parse(request.body);
      const judge = await app.prisma.judge.findUnique({
        where: { email: payload.email.toLowerCase() },
        include: { labs: true }
      });
      if (!judge) {
        throw new AuthError("Invalid credentials");
      }

      const validPassword = await bcrypt.compare(payload.password, judge.passwordHash);
      if (!validPassword) {
        throw new AuthError("Invalid credentials");
      }

      const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@hackathon.dev").toLowerCase();
      const role = judge.email.toLowerCase() === adminEmail ? "admin" : "judge";
      const assignedLabs = judge.labs.map((lab) => lab.labId);
      const token = await app.jwt.sign({
        id: judge.id,
        role,
        domain: judge.domain,
        assignedLabs
      });

      return { token };
    }
  );

  app.post(
    "/participant/magic-link",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" }
          }
        }
      }
    },
    async (request) => {
      const payload = participantMagicLinkSchema.parse(request.body);
      const participant = await app.prisma.participant.findUnique({
        where: { email: payload.email.toLowerCase() },
        select: { id: true, email: true, name: true }
      });
      if (!participant) {
        throw new NotFoundError("Participant");
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        throw new InternalError("RESEND_API_KEY is not configured");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await app.redis.set(redisKeys.participantOtp(participant.email), otp, "EX", 600);

      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: "Hackathon <no-reply@hackathon.dev>",
        to: participant.email,
        subject: "Your participant login code",
        html: `<p>Hello ${participant.name}, your one-time code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
      });

      return { success: true };
    }
  );
};

export default authRoutes;
