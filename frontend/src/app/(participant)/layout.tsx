import Link from "next/link";

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex gap-3 text-sm">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/submit">Submit</Link>
        <Link href="/prompts">Prompts</Link>
      </header>
      {children}
    </div>
  );
}
