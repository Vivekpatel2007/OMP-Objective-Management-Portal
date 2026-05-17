import Link from "next/link";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-100 p-5">
        <h1 className="mb-8 text-2xl font-bold">
          Employee Panel
        </h1>

        <nav className="space-y-3">
          <Link
            href="/employee/dashboard"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            Dashboard
          </Link>
          <Link
            href="/employee/goals"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            My Goals
          </Link>

          <Link
            href="/employee/goals/create"
            className="block rounded px-3 py-2 hover:bg-gray-200"
          >
            Create Goal
          </Link>
        </nav>
      </aside>

      <main className="flex-1 bg-white">
        {children}
      </main>
    </div>
  );
}