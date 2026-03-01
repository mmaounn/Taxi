import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Sidebar, MobileMenuButton } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  if (role === "DRIVER") {
    redirect("/driver-portal");
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Full-width top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenuButton />
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            <span className="text-orange-600">meine</span>flotte.at
          </Link>
        </div>
        <Header />
      </div>
      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
