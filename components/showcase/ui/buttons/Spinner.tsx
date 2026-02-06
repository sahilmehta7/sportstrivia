"use client";

import * as React from "react";
import { ButtonSize } from "./buttonTheme";

const sizeMap: Record<ButtonSize, string> = {
  xs: "h-3 w-3 border-2",
  sm: "h-3.5 w-3.5 border-2",
  md: "h-4 w-4 border-2",
  lg: "h-5 w-5 border-2",
  xl: "h-6 w-6 border-3",

};

export function ShowcaseSpinner({ size = "md" as ButtonSize }) {
  return (
    <span
      className={[
        "inline-block animate-spin rounded-full",
        sizeMap[size],
        // Use currentColor to blend with variant text
        "border-current border-t-transparent",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}


