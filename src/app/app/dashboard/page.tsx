import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to /connect where analytics dashboard is integrated
  redirect("/connect");
}