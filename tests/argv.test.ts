import { describe, expect, it } from "vitest";
import { parseArgv } from "../src/utils/argv.js";

describe("parseArgv", () => {
  it("splits a command without invoking a shell", () => {
    expect(parseArgv("fixture-cli --name 'hello world'")).toEqual([
      "fixture-cli",
      "--name",
      "hello world"
    ]);
  });

  it("rejects unclosed quotes", () => {
    expect(() => parseArgv("fixture-cli 'oops")).toThrow("Unclosed quote");
  });
});

