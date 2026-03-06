import { redirect } from "next/navigation";

// Contributor applications now live on the Community page
export default function ContributePage() {
  redirect("/community");
}
