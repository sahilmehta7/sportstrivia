import { JsonLdScript } from "next-seo";

interface StructuredListItem {
  position: number;
  name: string;
  url?: string;
  item?: string;
  image?: string;
  description?: string;
}

interface ItemListStructuredDataProps {
  name: string;
  itemListElements: StructuredListItem[];
  id?: string;
}

function toListItem(element: StructuredListItem) {
  const href = element.item ?? element.url;
  if (!href) {
    return null;
  }

  return {
    "@type": "ListItem",
    position: element.position,
    name: element.name,
    item: href,
    ...(element.image ? { image: element.image } : {}),
    ...(element.description ? { description: element.description } : {}),
  };
}

export function ItemListStructuredData({ name, itemListElements, id }: ItemListStructuredDataProps) {
  const listItems = itemListElements.map(toListItem).filter(Boolean);

  if (listItems.length === 0) {
    return null;
  }

  const scriptKey =
    id ??
    `item-list-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;

  return (
    <JsonLdScript
      scriptKey={scriptKey}
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        itemListElement: listItems,
      }}
    />
  );
}

