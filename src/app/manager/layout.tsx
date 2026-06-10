import Link from "next/link";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-100 p-5">
        <h1 className="mb-8 text-2xl font-bold">
          Manager Panel
        </h1>

        <nav className="space-y-3">
          <Link
            href="/manager/dashboard"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            Dashboard
          </Link>
        </nav>
      </aside>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}