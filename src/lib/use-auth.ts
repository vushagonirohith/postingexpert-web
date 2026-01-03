import { isAuthed } from "@/lib/auth";

export function useAuth() {
  const isAuthenticated = typeof window !== "undefined" ? isAuthed() : false;

  return {
    isAuthenticated,
    user: isAuthenticated
      ? {
          name: localStorage.getItem("username") || "User",
          role: "user",
        }
      : null,
  };
}
