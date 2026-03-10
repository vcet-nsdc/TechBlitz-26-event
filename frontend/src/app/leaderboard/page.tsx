"use client";

type RingProps = {
  score: number;
  label: string;
};

function Ring({ score, label }: RingProps) {
  const safeScore = Math.max(0, Math.min(10, score));
  const percent = (safeScore / 10) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid h-14 w-14 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#0f766e ${percent}%, #d1d5db ${percent}% 100%)`,
        }}
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-xs font-semibold">
          {safeScore.toFixed(1)}
        </div>
      </div>
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const githubScore = 8.2;
  const figmaScore = 6.1;
  const total = githubScore * 0.7 + figmaScore * 0.3;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#cffafe_0%,#f8fafc_45%,#f1f5f9_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold">Leaderboard Team Card</h1>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <header className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Team Nova</h2>
              <p className="text-sm text-slate-500">UIUX Lab 1</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Total {total.toFixed(1)}
            </div>
          </header>

          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium">GitHub</h3>
            <p className="text-sm text-slate-700">
              Existing GitHub scoring remains unchanged.
            </p>
          </section>

          <section className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Figma</h3>
              <span className="text-sm font-semibold">
                {figmaScore.toFixed(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Ring label="activity" score={7.4} />
              <Ring label="coverage" score={6.8} />
              <Ring label="maturity" score={5.6} />
              <Ring label="collab" score={7.0} />
            </div>
            <p className="text-sm text-slate-600">frames: 12 versions: 28</p>
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 p-4 text-sm">
            <p>GitHub {githubScore.toFixed(1)} x 70%</p>
            <p>Figma {figmaScore.toFixed(1)} x 30%</p>
            <hr className="my-2" />
            <p className="font-semibold">Total {total.toFixed(1)}</p>
          </section>
        </article>
      </div>
    </main>
  );
}
