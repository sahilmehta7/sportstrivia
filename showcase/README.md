# Showcase Component Library

This directory aggregates the reusable glassmorphism-styled components that power the quiz showcase experiences. Components are theme-aware (light + dark) and integrate with the `ShowcaseThemeProvider`.

## Structure

- `components/` – entry point that re-exports showcase UI primitives and layout helpers so application pages can import from `showcase/components`.
- UI primitives live in `components/showcase/ui/` and include search, filter, breadcrumb, footer, and card widgets used across the redesigned quiz listing experience.

## Usage

```tsx
import { ShowcaseLayout, ShowcaseSearchBar, ShowcaseFilterBar } from "@/showcase/components";

function Example() {
  return (
    <ShowcaseLayout title="Discover" badge="QUIZ SHOWCASE">
      <ShowcaseSearchBar onSubmit={(query) => console.log(query)} />
    </ShowcaseLayout>
  );
}
```

All components consume the global showcase theme. Wrap consuming views with `ShowcaseThemeProvider` or use existing showcase pages to inherit theme controls.
