import Anthropic from "@anthropic-ai/sdk";

interface StackPromptInput {
  technologies: { name: string; description: string }[];
}

interface RerollPromptInput extends StackPromptInput {
  oldDescriptionSummary: string;
}

export function buildStackPrompt(input: StackPromptInput): string {
  const techList = input.technologies
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  const acronym = input.technologies.map((t) => t.name[0].toUpperCase()).join("");
  const names = input.technologies.map((t) => t.name).join(", ");

  return `You are writing a short, confident description of a developer technology stack called the "${acronym}" stack, made up of: ${names}.

Here is what each technology does:
${techList}

Write a very concise explanation of what this stack is and how it works. For each technology, brieflyh explain what role it plays in the stack — as if this were a real, functioning application architecture that a team deliberately chose. Be matter-of-fact and technical, like a senior engineer explaining their architecture to a new hire. Every technology should be mentioned by name and given a clear role.

Lead or end with a one-liner recommendation on something this stack would be great for.

If the combination doesn't make obvious sense together (e.g., multiple databases, or tools that serve similar purposes), find a creative but plausible way they could work together. Don't call attention to the absurdity — just explain it straight.

Keep it concise. No bullet points. No headers. Just clean paragraphs. Bold the names of the technologies in use.`;
}

export function buildRerollPrompt(input: RerollPromptInput): string {
  const base = buildStackPrompt(input);
  return `${base}

A previous description of this stack described it as: "${input.oldDescriptionSummary}". Write a completely different take — different angle, different framing, but still technically grounded.`;
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
