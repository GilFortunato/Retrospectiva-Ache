import "server-only";
import { createHash } from "node:crypto";
import type { TeacherHighlights } from "@/lib/approvalRanking";

// Keep the ordered identifiers separate from names in the public repository.
const priorityDigests = [
  "c25cb31938b885e3cc1e362ca0c0f5d980887a9ed7ec4dfe38f93547f1609b3a",
  "c89b1ca7fa1ccd9e35dc816a843369c3374df169ecb5e8397f3a8ff8b5af25c2",
];

export function recommendationPriorities(highlights: TeacherHighlights = {}) {
  const priorities: Record<string, number> = {};
  for (const [classId, entries] of Object.entries(highlights)) {
    for (const name of Object.keys(entries)) {
      const key = `${classId}:${name}`;
      const digest = createHash("sha256").update(key).digest("hex");
      const index = priorityDigests.indexOf(digest);
      if (index !== -1) priorities[key] = index + 1;
    }
  }
  return priorities;
}
