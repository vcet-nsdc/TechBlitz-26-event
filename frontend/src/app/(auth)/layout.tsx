export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">{children}</div>;
}
