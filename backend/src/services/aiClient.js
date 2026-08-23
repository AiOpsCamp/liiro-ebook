const axios = require("axios");

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function normalizeProvider(provider) {
  return String(provider || process.env.AI_PROVIDER || "groq").toLowerCase();
}

function getProviderConfig(provider) {
  const normalizedProvider = normalizeProvider(provider);

  if (normalizedProvider === "hosted") {
    return {
      provider: "hosted",
      baseUrl:
        process.env.LOCAL_AI_BASE_URL ||
        process.env.HOSTED_AI_BASE_URL ||
        "http://localhost:11434/v1",
      apiKey: process.env.LOCAL_AI_API_KEY || process.env.HOSTED_AI_API_KEY || "",
      model: process.env.LOCAL_AI_MODEL || process.env.HOSTED_AI_MODEL || "",
      path: process.env.LOCAL_AI_PATH || process.env.HOSTED_AI_PATH || "/chat/completions",
    };
  }

  return {
    provider: "groq",
    baseUrl: GROQ_BASE_URL,
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    path: "/chat/completions",
  };
}

function getHostedConfigFromRequest(requestConfig = {}) {
  return {
    provider: "hosted",
    baseUrl:
      String(requestConfig.baseUrl || "").trim() ||
      process.env.LOCAL_AI_BASE_URL ||
      process.env.HOSTED_AI_BASE_URL ||
      "http://localhost:11434/v1",
    apiKey:
      String(requestConfig.apiKey || "").trim() ||
      process.env.LOCAL_AI_API_KEY ||
      process.env.HOSTED_AI_API_KEY ||
      "",
    model:
      String(requestConfig.model || "").trim() ||
      process.env.LOCAL_AI_MODEL ||
      process.env.HOSTED_AI_MODEL ||
      "",
    path:
      String(requestConfig.path || "").trim() ||
      process.env.LOCAL_AI_PATH ||
      process.env.HOSTED_AI_PATH ||
      "/chat/completions",
  };
}

function getBaseOrigin(baseUrl) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "";
  }
}

async function resolveHostedModel(config) {
  if (config.model) {
    return config.model;
  }

  const origin = getBaseOrigin(config.baseUrl);
  const candidates = [`${config.baseUrl.replace(/\/+$/, "")}/models`];

  if (origin) {
    candidates.push(`${origin}/v1/models`);
    candidates.push(`${origin}/api/tags`);
  }

  for (const candidate of candidates) {
    try {
      const response = await axios.get(candidate, {
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        timeout: 5000,
      });

      const modelFromOpenAIList = response.data?.data?.[0]?.id;
      if (modelFromOpenAIList) {
        return modelFromOpenAIList;
      }

      const modelFromOllamaTags = response.data?.models?.[0]?.name;
      if (modelFromOllamaTags) {
        return modelFromOllamaTags;
      }
    } catch {
      // Try the next discovery endpoint.
    }
  }

  return "qwen2.5:14b";
}

function extractContent(data) {
  return (
    data?.choices?.[0]?.message?.content ||
    data?.message?.content ||
    data?.content ||
    data?.response ||
    ""
  );
}

async function callAiChatCompletion({
  provider,
  requestConfig = {},
  messages,
  temperature = 0.4,
  maxTokens = 2000,
  responseFormat = "json_object",
}) {
  const normalizedProvider = normalizeProvider(provider);
  const config =
    normalizedProvider === "hosted"
      ? getHostedConfigFromRequest(requestConfig)
      : getProviderConfig(normalizedProvider);

  if (!config.baseUrl) {
    throw new Error(`${config.provider} API base URL not configured`);
  }

  if (normalizedProvider === "hosted") {
    config.model = await resolveHostedModel(config);
  }

  const payload = {
    model: config.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat) {
    payload.response_format = { type: responseFormat };
  }

  const response = await axios.post(
    `${config.baseUrl.replace(/\/+$/, "")}${config.path}`,
    payload,
    {
      headers: {
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const content = extractContent(response.data);
  if (!content) {
    throw new Error(`No content returned from ${config.provider} API`);
  }

  return { content, raw: response.data, provider: config.provider };
}

module.exports = {
  callAiChatCompletion,
  getHostedConfigFromRequest,
  getProviderConfig,
  normalizeProvider,
};
