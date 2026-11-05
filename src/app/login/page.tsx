import { redirect } from "next/navigation";

// Keep old entry links working without asking visitors to authenticate.
export default function LoginPage() {
  redirect("/home");
}
