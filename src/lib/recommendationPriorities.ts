import "server-only";
import { createHash } from "node:crypto";
import type { LoadedDiaries } from "@/components/aprovados/ApprovalPanel";
import { participantKey } from "@/lib/participantName";

// Keep the ordered identifiers separate from names in the public repository.
const priorityDigests = [
  "c25cb31938b885e3cc1e362ca0c0f5d980887a9ed7ec4dfe38f93547f1609b3a",
  "c89b1ca7fa1ccd9e35dc816a843369c3374df169ecb5e8397f3a8ff8b5af25c2",
  "cc185c833c7f4062ad504ea5844893498b5499ceda90112dc583942e786aa41b",
];

export function recommendationPriorities(diaries: LoadedDiaries = {}) {
  const priorities: Record<string, number> = {};
  for (const [classId, diary] of Object.entries(diaries)) {
    for (const participant of diary.results.approved) {
      const key = `${classId}:${participantKey(participant.name)}`;
      const digest = createHash("sha256").update(key).digest("hex");
      const index = priorityDigests.indexOf(digest);
      if (index !== -1) priorities[key] = index + 1;
    }
  }
  return priorities;
}
