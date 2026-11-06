import { redirect } from "next/navigation";
import PortalAccessForm from "@/components/acesso/PortalAccessForm";
import { currentPortalSession } from "@/lib/portalAuth";

export default async function ChangePasswordPage() {
  const session = await currentPortalSession();
  if (!session) redirect("/login");
  return <PortalAccessForm change firstAccess={session.must_change_password} />;
}
