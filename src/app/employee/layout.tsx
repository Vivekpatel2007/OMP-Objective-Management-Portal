import Link from "next/link";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      
      <main className="flex-1 bg-white">
        {children}
      </main>
    </div>
  );
}