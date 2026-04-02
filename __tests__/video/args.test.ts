import { parseCliArgs } from "@/video/cli/args";

describe("video cli args", () => {
  it("throws when quizSlug is provided without a value", () => {
    expect(() => parseCliArgs(["--quizSlug"])).toThrow(/requires a value/i);
  });

  it("throws when out is provided without a value", () => {
    expect(() => parseCliArgs(["--quizSlug=my-quiz", "--out"])).toThrow(/requires a value/i);
  });

  it("parses valid slug input", () => {
    const parsed = parseCliArgs(["--quizSlug=my-quiz", "--fps=30"]);
    expect(parsed.input.quizSlug).toBe("my-quiz");
    expect(parsed.input.fps).toBe(30);
    expect(parsed.input.videoFormat).toBe("landscape");
    expect(parsed.input.showAnswerReveal).toBe(true);
  });

  it("parses showAnswerReveal=false", () => {
    const parsed = parseCliArgs(["--quizSlug=my-quiz", "--showAnswerReveal=false"]);
    expect(parsed.input.showAnswerReveal).toBe(false);
  });

  it("parses explicit seed", () => {
    const parsed = parseCliArgs(["--quizSlug=my-quiz", "--seed=episode-01"]);
    expect(parsed.input.seed).toBe("episode-01");
  });

  it("parses questionTimeLimitSeconds and shorts format", () => {
    const parsed = parseCliArgs([
      "--quizSlug=my-quiz",
      "--questionTimeLimitSeconds=12",
      "--videoFormat=shorts",
    ]);
    expect(parsed.input.questionTimeLimitSeconds).toBe(12);
    expect(parsed.input.videoFormat).toBe("shorts");
  });

  it("throws on invalid showAnswerReveal value", () => {
    expect(() => parseCliArgs(["--quizSlug=my-quiz", "--showAnswerReveal=nope"])).toThrow(
      /expected "true" or "false"/i
    );
  });

  it("throws on invalid videoFormat value", () => {
    expect(() => parseCliArgs(["--quizSlug=my-quiz", "--videoFormat=square"])).toThrow(
      /expected "landscape" or "shorts"/i
    );
  });
});
