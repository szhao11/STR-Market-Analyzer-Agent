import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAiApiKey, getOpenAiModel } from "./config";

function getClient(): OpenAI {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

export async function generateStructuredJson<T extends z.ZodType>(
  systemPrompt: string,
  userPrompt: string,
  schema: T,
  schemaName: string
): Promise<z.infer<T>> {
  const client = getClient();
  const model = getOpenAiModel();

  const run = async (retryFix = false): Promise<z.infer<T>> => {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: retryFix
          ? `${userPrompt}\n\nYour previous response failed validation. Return valid JSON matching the schema exactly.`
          : userPrompt,
      },
    ];

    const completion = await client.chat.completions.parse({
      model,
      messages,
      response_format: zodResponseFormat(schema, schemaName),
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error("LLM returned empty parsed response");
    }
    return parsed;
  };

  try {
    return await run(false);
  } catch {
    return await run(true);
  }
}
