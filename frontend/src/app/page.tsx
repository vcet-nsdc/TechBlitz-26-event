export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">HackBoard Tracking Console</h1>
        <p className="mt-2 text-slate-600">
          Figma tracking has been added as an isolated system. Use the links
          below to access the new screens.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="rounded-lg bg-slate-900 px-4 py-2 text-white"
            href="/admin"
          >
            Open Admin Panel
          </a>
          <a
            className="rounded-lg border border-slate-300 px-4 py-2"
            href="/leaderboard"
          >
            Open Leaderboard Card
          </a>
        </div>
      </div>
    </main>
  );
}
