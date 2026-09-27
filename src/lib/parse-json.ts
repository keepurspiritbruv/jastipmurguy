export function extractJson(content: string, requiredKey?: string): unknown {
  const markerStart = "[[JSON]]";
  const markerEnd = "[[/JSON]]";
  const si = content.lastIndexOf(markerStart);
  if (si !== -1) {
    const ei = content.indexOf(markerEnd, si);
    if (ei !== -1) {
      const inner = content
        .slice(si + markerStart.length, ei)
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      try {
        return JSON.parse(inner);
      } catch {
        // fall through to brace scan
      }
    }
  }

  const cleaned = content.replace(/```json/gi, "").replace(/```/g, "");
  const candidates: unknown[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "{") continue;
    let depth = 0;
    let end = -1;
    let inStr = false;
    for (let j = i; j < cleaned.length; j++) {
      const c = cleaned[j];
      if (inStr) {
        if (c === "\\") {
          j++;
          continue;
        }
        if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') {
        inStr = true;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) break;
    try {
      candidates.push(JSON.parse(cleaned.slice(i, end + 1)));
    } catch {
      // skip malformed candidate
    }
    i = end;
  }
  if (requiredKey) {
    for (let k = candidates.length - 1; k >= 0; k--) {
      const c = candidates[k];
      if (c && typeof c === "object" && requiredKey in (c as Record<string, unknown>)) {
        return c;
      }
    }
  }
  if (candidates.length === 0) throw new Error("Jawaban AI tidak berisi JSON");
  return candidates[candidates.length - 1];
}
