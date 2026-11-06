import { currentPortalSession } from "@/lib/portalAuth";
import { retrospectiveDatabase } from "@/lib/retrospectiveDatabase";
import { localSurveyComments, type SurveyCommentGroup } from "@/app/satisfacao/localComments";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ ciclo: string }> }) {
  try {
    const session = await currentPortalSession();
    if (!session || session.must_change_password) {
      return Response.json({ message: "Entre novamente para ver os comentários." }, { status: 401, headers });
    }

    const { ciclo } = await params;
    if (!/^[1-6]$/.test(ciclo)) {
      return Response.json({ message: "Ciclo não encontrado." }, { status: 404, headers });
    }
    const cycle = Number(ciclo);

    const groups = process.env.CANDIDATOS_DATABASE_URL
      ? (await retrospectiveDatabase().query<{ groups: SurveyCommentGroup[] }>(
        "SELECT comment_groups AS groups FROM survey_cycles WHERE cycle = $1", [cycle],
      )).rows[0]?.groups
      : await localSurveyComments(cycle);

    if (!groups) return Response.json({ message: "Os comentários deste ciclo estão indisponíveis." }, { status: 503, headers });
    return Response.json({ groups }, { headers });
  } catch {
    return Response.json({ message: "Não foi possível carregar os comentários. Tente novamente." }, { status: 503, headers });
  }
}
