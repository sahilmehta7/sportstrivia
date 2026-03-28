import { handleError } from "@/lib/errors";

describe("handleError", () => {
  it("does not expose raw internal error messages for generic errors", async () => {
    const response = handleError(new Error("database timeout while connecting to primary"));
    expect(typeof (response as any).json).toBe("function");
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe("INTERNAL_ERROR");
    expect(json.error).toBe("Internal server error");
  });
});
