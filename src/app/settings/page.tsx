import Link from "next/link";
import { DeleteDataCard } from "./DeleteDataCard";

export const metadata = {
  title: "Settings | PostingExpert",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences and data.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
        >
          ← Back
        </Link>
      </div>

      <DeleteDataCard />
    </main>
  );
}
