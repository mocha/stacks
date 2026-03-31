import Anthropic from "@anthropic-ai/sdk";

export async function vibeCheckUrl(
  name: string,
  url: string
): Promise<{ ok: boolean; reason: string }> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `A user is suggesting a technology called "${name}" with the URL "${url}" for inclusion in a developer tools directory.

Does this appear to be a legitimate software project/technology? Is there anything inappropriate, offensive, or concerning about the name or URL?

Respond with JSON: { "ok": true/false, "reason": "brief explanation" }`,
      },
    ],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, reason: "Could not parse moderation response" };
  }
}
