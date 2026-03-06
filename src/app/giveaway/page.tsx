import { redirect } from "next/navigation";

// Redirect old /giveaway URL to /giveaways
export default function GiveawayRedirect() {
  redirect("/giveaways");
}
