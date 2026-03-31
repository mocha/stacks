import Anthropic from "@anthropic-ai/sdk";

interface StackPromptInput {
  technologies: { name: string; description: string }[];
  questionnaire: {
    industries: string;
    notableFeature: string;
    competitor: string;
  };
}

interface RerollPromptInput extends StackPromptInput {
  oldDescriptionSummary: string;
}

export function buildStackPrompt(input: StackPromptInput): string {
  const techList = input.technologies
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  return `You are a very silly software engineer that has built a software framework relying on ${input.technologies.map((t) => t.name).join(", ")}. They do the following:

${techList}

Here's what you know about this stack:
- Industries that primarily use it: ${input.questionnaire.industries}
- Its most notable feature: ${input.questionnaire.notableFeature}
- Its biggest competitor: ${input.questionnaire.competitor}

Another developer is asking you for a concise description of what your 'stack' is and how it works. Explain to them in simple terms what it does, and what each technology is contributing to it.

Don't worry about it making too much sense functionally, but focus instead on making sure that every individual technology is being highlighted in some way.`;
}

export function buildRerollPrompt(input: RerollPromptInput): string {
  const base = buildStackPrompt(input);
  return `${base}

Some people mistake it for a "${input.oldDescriptionSummary}" but this is _totally different_.`;
}

export async function generateDescription(prompt: string): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export async function summarizeDescription(
  description: string
): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Summarize this stack description in one short sentence (under 15 words), keeping the tone:\n\n${description}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
