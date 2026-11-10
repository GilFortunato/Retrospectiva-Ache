export const evaluationTags = {
  Destaque: "Desempenho elevado nas avaliações, com reconhecimento nas atividades ou no parecer docente.",
  Evolução: "Melhora nas notas semanais ao longo da formação.",
  Constância: "Desempenho estável na maior parte das avaliações semanais.",
  Dedicação: "Esforço e comprometimento com a formação registrados no parecer docente.",
  Desenvolvimento: "As avaliações indicam espaço para consolidar os conteúdos trabalhados.",
  Oscilação: "Alternância entre notas mais altas e mais baixas ao longo do curso.",
  Retomada: "Retorno à frequência regular após faltas nas primeiras aulas.",
};

export type EvaluationTag = keyof typeof evaluationTags;
