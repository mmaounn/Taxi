"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { LayoutDashboard, Receipt, Car } from "lucide-react";

const navItems = [
  { href: "/driver-portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver-portal/rides", label: "Fahrten", icon: Car },
  { href: "/driver-portal/settlements", label: "Settlements", icon: Receipt },
];

export default function DriverPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <aside className="flex h-full w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/driver-portal" className="text-lg font-bold text-gray-900">
            Fahrer-Portal
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/driver-portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
