import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TopicAuthoritySectionProps = {
  topicName: string;
  introMd: string;
  keyFactsMd: string;
  timelineMd?: string | null;
  analysisMd: string;
  faqMd: string;
  sourcesMd: string;
  lastReviewedAt?: Date | string | null;
};

function mdBulletsToItems(md: string): string[] {
  return md
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function mdParagraphs(md: string): string[] {
  return md
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("### "));
}

function parseFaq(md: string): Array<{ q: string; a: string }> {
  const sections = md.split(/\n(?=###\s+)/g);
  const items: Array<{ q: string; a: string }> = [];
  for (const section of sections) {
    const lines = section.split("\n").map((v) => v.trim()).filter(Boolean);
    if (!lines[0]?.startsWith("### ")) continue;
    const q = lines[0].replace(/^###\s+/, "").trim();
    const a = lines.slice(1).join(" ");
    if (q && a) items.push({ q, a });
  }
  return items.slice(0, 8);
}

function parseSources(md: string): Array<{ label: string; url: string }> {
  const links = md.match(/\[([^\]]+)\]\(([^)]+)\)/g) ?? [];
  return links
    .map((raw) => {
      const m = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!m) return null;
      return { label: m[1], url: m[2] };
    })
    .filter((v): v is { label: string; url: string } => Boolean(v));
}

export function TopicAuthoritySection({
  topicName,
  introMd,
  keyFactsMd,
  timelineMd,
  analysisMd,
  faqMd,
  sourcesMd,
  lastReviewedAt,
}: TopicAuthoritySectionProps) {
  const keyFacts = mdBulletsToItems(keyFactsMd);
  const timeline = mdBulletsToItems(timelineMd || "");
  const analysisParagraphs = mdParagraphs(analysisMd);
  const faqs = parseFaq(faqMd);
  const sources = parseSources(sourcesMd);
  const reviewed =
    lastReviewedAt ? new Date(lastReviewedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

  return (
    <section className="space-y-6" id="topic-authority">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">About {topicName}</CardTitle>
          <CardDescription>Source-grounded insights and context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{introMd}</p>
        </CardContent>
      </Card>

      {keyFacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {keyFacts.map((fact, idx) => (
                <li key={`${fact}-${idx}`}>{fact}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {timeline.map((item, idx) => (
                <li key={`${item}-${idx}`}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysisParagraphs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Why It Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysisParagraphs.map((p, idx) => (
              <p key={`${idx}-${p.slice(0, 16)}`} className="text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {faqs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={`${faq.q}-${idx}`}>
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(sources.length > 0 || reviewed) && (
        <Card>
          <CardHeader>
            <CardTitle>Sources & Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewed && <p className="text-xs text-muted-foreground">Last reviewed: {reviewed}</p>}
            {sources.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {sources.map((source, idx) => (
                  <li key={`${source.url}-${idx}`}>
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
