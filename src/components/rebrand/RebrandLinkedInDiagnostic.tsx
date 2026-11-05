import { CheckCircle2, UserRoundPen } from "lucide-react";

export function RebrandLinkedInDiagnostic() {
  return (
    <section className="rebrandEmpty" aria-labelledby="rebrand-guide-title">
      <UserRoundPen size={36} aria-hidden="true" />
      <h2 id="rebrand-guide-title">Sua marca profissional continua em construção.</h2>
      <p>
        O diagnóstico automático e o histórico de resultados não estão disponíveis
        nesta retrospectiva. Use estas orientações para revisar seu LinkedIn:
      </p>
      <ul className="retrospectivaChecklist">
        <li><CheckCircle2 size={18} aria-hidden="true" />Comunique no título seu objetivo como Propagandista Trainee.</li>
        <li><CheckCircle2 size={18} aria-hidden="true" />Conecte suas experiências reais às competências de comunicação, atendimento e relacionamento.</li>
        <li><CheckCircle2 size={18} aria-hidden="true" />Inclua exemplos e resultados que você consegue comprovar.</li>
        <li><CheckCircle2 size={18} aria-hidden="true" />Revise as formações, as competências e o texto Sobre.</li>
      </ul>
    </section>
  );
}
