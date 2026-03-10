import got from "got";
import { AppError } from "../../lib/errors";

function parseGithubRepo(url: string): { owner: string; repo: string } {
  const normalized = new URL(url);
  if (!normalized.hostname.includes("github.com")) {
    throw new AppError("Invalid GitHub URL", 400);
  }

  const parts = normalized.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new AppError("GitHub URL must include owner and repo", 400);
  }

  return { owner: parts[0], repo: parts[1].replace(".git", "") };
}

export async function validateGithubRepo(url: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new AppError("GITHUB_TOKEN is not configured", 500);
  }

  const { owner, repo } = parseGithubRepo(url);
  const response = await got(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "hackathon-backend"
    },
    throwHttpErrors: false,
    responseType: "json"
  });

  if (response.statusCode !== 200) {
    return false;
  }

  const body = response.body as { private?: boolean };
  return body.private === false;
}

export async function validateFigmaUrl(url: string): Promise<boolean> {
  const response = await got.head(url, {
    throwHttpErrors: false
  });
  return response.statusCode === 200;
}
