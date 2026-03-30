/** @jest-environment node */

import fs from "node:fs";
import path from "node:path";

function findDynamicSegmentSiblingConflicts(rootDir: string): Array<{
  directory: string;
  segments: string[];
}> {
  const conflicts: Array<{ directory: string; segments: string[] }> = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const childDirectories = entries.filter((entry) => entry.isDirectory());
    const dynamicSegmentDirectories = childDirectories
      .map((entry) => entry.name)
      .filter((name) => /^\[[^/]+\]$/.test(name));

    if (dynamicSegmentDirectories.length > 1) {
      conflicts.push({
        directory: currentDir,
        segments: dynamicSegmentDirectories.sort(),
      });
    }

    for (const child of childDirectories) {
      walk(path.join(currentDir, child.name));
    }
  }

  walk(rootDir);
  return conflicts;
}

describe("app route dynamic segment structure", () => {
  it("does not allow sibling dynamic segments with different names", () => {
    const appDirectory = path.resolve(process.cwd(), "app");
    const conflicts = findDynamicSegmentSiblingConflicts(appDirectory);

    expect(conflicts).toEqual([]);
  });
});
