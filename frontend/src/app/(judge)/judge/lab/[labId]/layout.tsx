export default function LabLayout({
  children,
  leaderboard
}: {
  children: React.ReactNode;
  leaderboard: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      {children}
      {leaderboard}
    </div>
  );
}
