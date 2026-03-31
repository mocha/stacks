import { describe, it, expect } from "vitest";
import { buildStackPrompt, buildRerollPrompt } from "../llm";

describe("buildStackPrompt", () => {
  it("builds a prompt with technologies and questionnaire answers", () => {
    const prompt = buildStackPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
        { name: "Redis", description: "In-memory data store" },
      ],
      questionnaire: {
        industries: "Fintech, Memes",
        notableFeature: "Lightning-fast meme transactions",
        competitor: "The traditional banking system",
      },
    });

    expect(prompt).toContain("Bitcoin");
    expect(prompt).toContain("Decentralized digital currency");
    expect(prompt).toContain("Redis");
    expect(prompt).toContain("Fintech, Memes");
    expect(prompt).toContain("Lightning-fast meme transactions");
    expect(prompt).toContain("traditional banking system");
    expect(prompt).not.toContain("Some people mistake it for");
  });
});

describe("buildRerollPrompt", () => {
  it("includes the old description summary in the prompt", () => {
    const prompt = buildRerollPrompt({
      technologies: [
        { name: "Bitcoin", description: "Decentralized digital currency" },
      ],
      questionnaire: {
        industries: "Fintech",
        notableFeature: "Speed",
        competitor: "Banks",
      },
      oldDescriptionSummary: "a meme-powered banking platform",
    });

    expect(prompt).toContain(
      'Some people mistake it for a "a meme-powered banking platform"'
    );
    expect(prompt).toContain("totally different");
  });
});
