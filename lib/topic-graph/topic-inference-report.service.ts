type Artifact = {
  filename: string;
  contentType: string;
  content: string;
};

type TypedRow = {
  topicId: string;
  name: string;
  slug: string;
  currentSchemaType: string;
  level: number;
  parentName: string;
  ancestorPath: string;
  nearestSportAncestorName: string;
  nearestSportAncestorSlug: string;
  inferredRelationTargetSlug: string;
  anomalyCodes: string;
};

type UntypedRow = {
  topicId: string;
  name: string;
  slug: string;
  level: number;
  parentName: string;
  ancestorPath: string;
  nearestTypedAncestorName: string;
  nearestTypedAncestorType: string;
  suggestedAction: string;
};

type AuditRow = {
  topicId: string;
  name: string;
  slug: string;
  currentSchemaType: string;
  ancestorPath: string;
  suggestedSchemaType: string | null;
  confidence: number | null;
  rationale: string;
};

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv<T extends Record<string, unknown>>(headers: Array<keyof T>, rows: T[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header] as any)).join(","));
  }
  return lines.join("\n");
}

export function buildInferenceCsvArtifact(
  kind: "typed" | "untyped",
  rows: Array<TypedRow | UntypedRow>
): Artifact {
  if (kind === "typed") {
    const headers: Array<keyof TypedRow> = [
      "topicId",
      "name",
      "slug",
      "currentSchemaType",
      "level",
      "parentName",
      "ancestorPath",
      "nearestSportAncestorName",
      "nearestSportAncestorSlug",
      "inferredRelationTargetSlug",
      "anomalyCodes",
    ];
    return {
      filename: "typed-topics-report.csv",
      contentType: "text/csv; charset=utf-8",
      content: buildCsv(headers, rows as TypedRow[]),
    };
  }

  const headers: Array<keyof UntypedRow> = [
    "topicId",
    "name",
    "slug",
    "level",
    "parentName",
    "ancestorPath",
    "nearestTypedAncestorName",
    "nearestTypedAncestorType",
    "suggestedAction",
  ];
  return {
    filename: "untyped-topics-report.csv",
    contentType: "text/csv; charset=utf-8",
    content: buildCsv(headers, rows as UntypedRow[]),
  };
}

export function buildTopicTypeAuditCsvArtifact(kind: "typed" | "untyped", rows: AuditRow[]): Artifact {
  const headers: Array<keyof AuditRow> = [
    "topicId",
    "name",
    "slug",
    "currentSchemaType",
    "ancestorPath",
    "suggestedSchemaType",
    "confidence",
    "rationale",
  ];

  return {
    filename: kind === "typed" ? "typed-topics-report.csv" : "untyped-topics-report.csv",
    contentType: "text/csv; charset=utf-8",
    content: buildCsv(headers, rows),
  };
}
