import React from "react";

interface StructuredDataProps {
  data: Record<string, any>;
  id?: string;
}

/**
 * StructuredData Component
 * 
 * Safely renders JSON-LD structured data in a script tag.
 * Use this component in Next.js App Router (Server or Client) to provide
 * SEO metadata that search engines can easily parse.
 */
export function StructuredData({ data, id }: StructuredDataProps) {
  if (!data) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
