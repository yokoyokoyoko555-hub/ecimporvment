export const OCHANOKO_GROUP_OPTIONS = [
  "★SALE★",
  "リーダーパラレル",
  "リーダー",
  "スーパーパラレル",
  "SP",
  "パラレル",
  "SEC",
  "SR",
  "R",
  "UC",
  "C",
  "プロモ",
  "フォイル",
  "フルアート",
  "再録版",
  "ドン!!カード",
] as const;

export function parseOchanokoGroups(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value || "")
        .split(/\r?\n/)
        .map((group) => group.trim())
        .filter(Boolean),
    ),
  );
}

export function serializeOchanokoGroups(groups: string[]) {
  return Array.from(new Set(groups.map((group) => group.trim()).filter(Boolean))).join(
    "\n",
  );
}

export function withDefaultDamagedSaleGroup(
  current: string | null | undefined,
) {
  return serializeOchanokoGroups([...parseOchanokoGroups(current), "★SALE★"]);
}

export function toggleOchanokoGroup(
  current: string | null | undefined,
  group: string,
  checked: boolean,
) {
  const groups = parseOchanokoGroups(current);
  const next = checked
    ? [...groups, group]
    : groups.filter((value) => value !== group);
  return serializeOchanokoGroups(next);
}
