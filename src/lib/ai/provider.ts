import { z } from "zod";
import { env, integrationStatus } from "@/lib/env";

/**
 * Provider-independent AI layer.
 * Agents must call this module rather than a vendor SDK directly.
 * Requests fail closed when no API key is configured.
 */
export type AiProviderName = "grok" | "openai";

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
      provider: AiProviderName;
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
  if (env.ai.defaultProvider === "openai" && env.ai.openaiKey) {
    return {
      name: "openai",
      key: env.ai.openaiKey,
      model: env.ai.openaiModel,
      baseUrl: "https://api.openai.com/v1",
    };
  }
  if (env.ai.grokKey) {
    return {
      name: "grok",
      key: env.ai.grokKey,
      model: env.ai.grokModel,
      baseUrl: env.ai.grokBaseUrl,
    };
  }
  if (env.ai.openaiKey) {
    return {
      name: "openai",
      key: env.ai.openaiKey,
      model: env.ai.openaiModel,
      baseUrl: "https://api.openai.com/v1",
    };
  }
  return {
    name: env.ai.defaultProvider === "openai" ? "openai" : "grok",
    key: undefined,
    model: env.ai.defaultProvider === "openai" ? env.ai.openaiModel : env.ai.grokModel,
    baseUrl: env.ai.defaultProvider === "openai" ? "https://api.openai.com/v1" : env.ai.grokBaseUrl,
  };
}

export function getAiStatus() {
  const status = integrationStatus();
  const provider = activeProvider();
  return {
    provider: provider.name,
    configured: Boolean(provider.key),
    grok: status.grok,
    openai: status.openai,
    model: provider.model,
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

async function requestOnce<T>(
  request: AiCompletionRequest,
): Promise<AiCompletionResult<T>> {
  const provider = activeProvider();
  if (!provider.key) {
    return {
      ok: false,
      error: `AI provider "${provider.name}" is not configured. Set GROK_API_KEY or OPENAI_API_KEY to activate ${request.agent}.`,
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

export async function completeStructured<T>(
  request: AiCompletionRequest,
): Promise<AiCompletionResult<T>> {
  const first = await requestOnce<T>(request);
  if (first.ok || first.code !== "invalid_json") return first;

  return requestOnce<T>({
    ...request,
    user: `${request.user}\n\nYour previous JSON failed validation: ${first.error}\nReturn corrected JSON only.`,
  });
}
