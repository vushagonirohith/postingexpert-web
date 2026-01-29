"use client";

import { useRouter } from "next/navigation";
import { getToken, clearAuth } from "src/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || ""; // e.g. https://xxxx.execute-api.ap-south-1.amazonaws.com/prod

export function DeleteDataCard() {
  const router = useRouter();

  const onDelete = async () => {
    const ok = window.confirm(
      "Are you sure? This will delete ALL your PostingExpert data. This cannot be undone."
    );
    if (!ok) return;

    try {
      const token = getToken();
      if (!token) {
        alert("You are not logged in.");
        router.push("/login");
        return;
      }

      if (!API_BASE) {
        alert(
          "NEXT_PUBLIC_API_BASE_URL is not set. Add it in your .env and restart dev server."
        );
        return;
      }

      const res = await fetch(`${API_BASE}/user/delete_all_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || "Failed to delete data";
        alert(msg);
        return;
      }

      // Success → logout locally and redirect
      clearAuth();
      alert("Your data has been deleted successfully.");
      router.push("/login");
    } catch (err: any) {
      alert(err?.message || "Something went wrong.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-base font-semibold text-foreground">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Delete your entire PostingExpert data. This is irreversible.
      </p>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900">
          This will delete: your user profile, survey/preferences data, and your
          connected social accounts.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-red-800">
            You will be logged out after deletion.
          </p>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete all my data
          </button>
        </div>
      </div>
    </section>
  );
}
