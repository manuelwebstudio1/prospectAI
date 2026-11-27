import { z } from "zod";
import { env, integrationStatus } from "@/lib/env";

/**
 * Optional HTTP model adapters. These are independent of Grok Bot.
 * Grok Bot connects through the MCP connector at /mcp — never through this module.
 * The xAI adapter stays disabled unless XAI_API_ENABLED=true AND a key is set.
 */
export type AiProviderName = "openai" | "xai" | "none";

export type AiCompletionRequest = {
  agent: string;
  schema: z.ZodTypeAny;
  system: string;
  user: string;
  temperature?: number;
};

export type AiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
};

export type AiCompletionResult<T> =
  | {
      ok: true;
      data: T;
      provider: Exclude<AiProviderName, "none">;
      model: string;
      usage: AiUsage;
    }
  | {
      ok: false;
      error: string;
      code: "not_configured" | "invalid_json" | "provider_error";
      provider: AiProviderName;
      model: string;
    };

function activeProvider(): {
  name: AiProviderName;
  key: string | undefined;
  model: string;
  baseUrl: string;
} {
  if (env.ai.defaultProvider === "xai" && env.ai.xaiEnabled && env.ai.xaiKey) {
    return { name: "xai", key: env.ai.xaiKey, model: env.ai.xaiModel, baseUrl: env.ai.xaiBaseUrl };
  }
  if (env.ai.openaiKey) {
    return {
      name: "openai",
      key: env.ai.openaiKey,
      model: env.ai.openaiModel,
      baseUrl: "https://api.openai.com/v1",
    };
  }
  if (env.ai.xaiEnabled && env.ai.xaiKey) {
    return { name: "xai", key: env.ai.xaiKey, model: env.ai.xaiModel, baseUrl: env.ai.xaiBaseUrl };
  }
  return {
    name: "none",
    key: undefined,
    model: env.ai.openaiModel,
    baseUrl: "",
  };
}

export function getAiStatus() {
  const status = integrationStatus();
  const provider = activeProvider();
  return {
    provider: provider.name,
    configured: Boolean(provider.key),
    openai: status.openai,
    xaiAdapter: status.xaiAdapter,
    model: provider.model,
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

async function requestOnce<T>(request: AiCompletionRequest): Promise<AiCompletionResult<T>> {
  const provider = activeProvider();
  if (!provider.key || provider.name === "none") {
    return {
      ok: false,
      error: `No optional HTTP model adapter is enabled. ${request.agent} will use records-only output. Grok Bot does not use this adapter — connect it at /mcp.`,
      code: "not_configured",
      provider: provider.name,
      model: provider.model,
    };
  }

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: request.temperature ?? 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${request.system}\n\nReturn only valid JSON. Do not invent facts. Use null for unknown scalar fields and [] for unknown lists.`,
          },
          { role: "user", content: request.user },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Provider error (${response.status}): ${body.slice(0, 280)}`,
        code: "provider_error",
        provider: provider.name,
        model: provider.model,
      };
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        error: "Empty model response.",
        code: "provider_error",
        provider: provider.name,
        model: provider.model,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = extractJson(content);
    } catch {
      return {
        ok: false,
        error: "Model did not return parseable JSON.",
        code: "invalid_json",
        provider: provider.name,
        model: provider.model,
      };
    }

    const parsed = request.schema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Model output failed schema validation: ${parsed.error.message}`,
        code: "invalid_json",
        provider: provider.name,
        model: provider.model,
      };
    }

    return {
      ok: true,
      data: parsed.data as T,
      provider: provider.name,
      model: provider.model,
      usage: {
        inputTokens: json.usage?.prompt_tokens ?? null,
        outputTokens: json.usage?.completion_tokens ?? null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown AI error",
      code: "provider_error",
      provider: provider.name,
      model: provider.model,
    };
  }
}

export async function completeStructured<T>(request: AiCompletionRequest): Promise<AiCompletionResult<T>> {
  const first = await requestOnce<T>(request);
  if (first.ok || first.code !== "invalid_json") return first;
  return requestOnce<T>({
    ...request,
    user: `${request.user}\n\nYour previous JSON failed validation: ${first.error}\nReturn corrected JSON only.`,
  });
}
