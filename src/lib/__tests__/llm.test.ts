import { describe, it, expect } from "vitest";
import { buildStackPrompt, buildRerollPrompt } from "../llm";

describe("buildStackPrompt", () => {
  it("builds a prompt with technology names and descriptions", () => {
    const prompt = buildStackPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
        { name: "Redis", description: "In-memory data store" },
      ],
    });

    expect(prompt).toContain("Bitcoin");
    expect(prompt).toContain("Decentralized digital currency");
    expect(prompt).toContain("Redis");
    expect(prompt).toContain("BR");
    expect(prompt).not.toContain("questionnaire");
  });
});

describe("buildRerollPrompt", () => {
  it("includes the old description summary in the prompt", () => {
    const prompt = buildRerollPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
      ],
      oldDescriptionSummary: "a meme-powered banking platform",
    });

    expect(prompt).toContain("a meme-powered banking platform");
    expect(prompt).toContain("different");
  });
});
