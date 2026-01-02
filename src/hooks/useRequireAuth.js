"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed } from "@/lib/auth";

export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // runs ONLY in browser
    if (!isAuthed()) {
      router.replace(redirectTo);
      return;
    }
    setReady(true);
  }, [router, redirectTo]);

  return { ready };
}
