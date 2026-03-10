"use client";

import { FormEvent, useMemo, useState } from "react";

type TeamRow = {
  id: string;
  name: string;
  domain: string;
  figmaAccessError: boolean;
  figmaSnapshots?: Array<{
    frameCount: number;
    versionCount: number;
  }>;
};

const domains = ["UIUX", "AGENTIC_AI", "VIBE_CODING"] as const;

export default function AdminPage() {
  const apiUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
    [],
  );
  const [adminToken, setAdminToken] = useState("");
  const [teamName, setTeamName] = useState("");
  const [domain, setDomain] = useState<(typeof domains)[number]>("UIUX");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [status, setStatus] = useState<{
    tone: "idle" | "good" | "bad";
    text: string;
  }>({
    tone: "idle",
    text: "Not checked",
  });

  async function refreshTeams() {
    if (!adminToken) {
      return;
    }

    const response = await fetch(`${apiUrl}/teams`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      setStatus({ tone: "bad", text: "Failed to fetch teams" });
      return;
    }

    const rows = (await response.json()) as TeamRow[];
    setTeams(rows);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus({ tone: "idle", text: "Checking Figma connection..." });
    const response = await fetch(`${apiUrl}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: teamName,
        domain,
        figmaUrl,
      }),
    });

    if (response.ok) {
      setStatus({ tone: "good", text: "Figma connected" });
      setTeamName("");
      setFigmaUrl("");
      await refreshTeams();
      return;
    }

    const body = (await response
      .json()
      .catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };
    setStatus({ tone: "bad", text: body.message ?? "Figma connection failed" });
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Admin Registration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create team with required Figma file URL.
          </p>

          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1 text-sm">
              Admin Token
              <input
                value={adminToken}
                onChange={(event) => setAdminToken(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Paste JWT"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Team Name
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Team Nova"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Domain
              <select
                value={domain}
                onChange={(event) =>
                  setDomain(event.target.value as (typeof domains)[number])
                }
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                {domains.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              Figma File URL
              <input
                value={figmaUrl}
                onChange={(event) => setFigmaUrl(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="https://www.figma.com/file/ABC123/project-name"
                required
              />
            </label>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Create Team
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => {
                  void refreshTeams();
                }}
              >
                Refresh Team List
              </button>
              <span
                className={
                  status.tone === "good"
                    ? "rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800"
                    : status.tone === "bad"
                      ? "rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-800"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                }
              >
                {status.text}
              </span>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Team List</h2>
          <div className="mt-4 space-y-3">
            {teams.length === 0 ? (
              <p className="text-sm text-slate-500">No teams loaded yet.</p>
            ) : null}
            {teams.map((team) => {
              const latest = team.figmaSnapshots?.[0];
              return (
                <article
                  key={team.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <strong>{team.name}</strong>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {team.domain}
                  </span>
                  {team.figmaAccessError ? (
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">
                      Warning: Figma 403
                    </span>
                  ) : null}
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                    frames: {latest?.frameCount ?? 0}
                  </span>
                  <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs text-cyan-800">
                    versions: {latest?.versionCount ?? 0}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
