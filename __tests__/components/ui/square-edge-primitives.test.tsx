import { badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import { inputVariants } from "@/components/ui/input";
import { tabsListVariants, tabsTriggerVariants } from "@/components/ui/tabs";

describe("square-edge primitives", () => {
  it("keeps card defaults unchanged for non-public surfaces", () => {
    expect(cardVariants()).toContain("rounded-lg");
  });

  it("keeps button defaults unchanged for non-public surfaces", () => {
    expect(buttonVariants()).toContain("rounded-sm");
  });

  it("keeps input defaults unchanged for non-public surfaces", () => {
    expect(inputVariants()).toContain("rounded-md");
  });

  it("keeps badge defaults unchanged for non-public surfaces", () => {
    expect(badgeVariants()).toContain("rounded-full");
  });

  it("keeps tabs defaults unchanged for non-public surfaces", () => {
    expect(tabsListVariants({ variant: "default" })).toContain("rounded-lg");
    expect(tabsTriggerVariants({ variant: "default" })).toContain("rounded-md");
  });
});
