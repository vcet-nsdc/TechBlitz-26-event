import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6">
      <header className="mb-6 flex gap-3 text-sm">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/teams">Teams</Link>
        <Link href="/admin/judges">Judges</Link>
        <Link href="/admin/config">Config</Link>
      </header>
      {children}
    </div>
  );
}
