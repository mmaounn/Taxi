import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <p className="text-sm text-gray-500"><span className="text-orange-600">meine</span>flotte.at</p>
        <nav className="flex gap-6 text-sm text-gray-500">
          <Link href="/impressum" className="hover:text-gray-900">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-gray-900">
            Datenschutz
          </Link>
          <Link href="mailto:kontakt@meineflotte.at" className="hover:text-gray-900">
            Kontakt
          </Link>
        </nav>
      </div>
    </footer>
  );
}
