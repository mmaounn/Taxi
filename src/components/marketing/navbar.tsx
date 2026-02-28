import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold text-gray-900">
          <span className="text-orange-600">meine</span>flotte.at
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Anmelden</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Kostenlos starten</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
