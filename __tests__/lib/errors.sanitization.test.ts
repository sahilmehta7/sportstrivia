import { handleError } from "@/lib/errors";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
      ...init,
    }),
  },
}));

describe("handleError", () => {
  it("does not expose raw internal error messages for generic errors", async () => {
    const response = handleError(new Error("database timeout while connecting to primary"));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.code).toBe("INTERNAL_ERROR");
    expect(json.error).toBe("Internal server error");
  });
});
