import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900">PostingExpert</p>
            <p className="mt-1 text-sm text-neutral-600">
              Silent social media automation for businesses.
            </p>
            <p className="mt-3 text-xs text-neutral-500">
              © {new Date().getFullYear()} PostingExpert. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
              <Link href="/privacy-policy" className="hover:text-neutral-900 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-neutral-900 hover:underline">
                Terms
              </Link>
              <Link href="mailto:contact@inikola.com" className="hover:text-neutral-900 hover:underline">
                contact@inikola.com
              </Link>
            </div>

            <p className="text-xs text-neutral-500">
              Inikola Technologies Private Limited
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
