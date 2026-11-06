import { redirect } from "next/navigation";
import PortalAccessForm from "@/components/acesso/PortalAccessForm";
import { currentPortalSession } from "@/lib/portalAuth";

export default async function LoginPage() {
  const session = await currentPortalSession().catch(() => null);
  if (session) redirect(session.must_change_password ? "/trocar-senha" : "/home");
  return <PortalAccessForm />;
}
