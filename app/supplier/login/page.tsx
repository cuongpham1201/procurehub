import { redirect } from "next/navigation";

// Redirect legacy supplier login URL to unified login page
export default function Page() {
  redirect("/login");
}
