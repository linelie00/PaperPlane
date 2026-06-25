// LLM API Key는 서버 환경변수에만 보관한다. 클라이언트에 노출하지 않는다. (CLAUDE.md)
//
// OpenAI 호환 chat/completions 엔드포인트를 사용한다.
// 기본값은 Upstage Solar이며, 환경변수만 바꾸면 Groq / Gemini(OpenAI 호환) /
// Ollama 등 다른 제공자로 교체할 수 있다.
//   - LLM_BASE_URL : 기본 https://api.upstage.ai/v1
//   - LLM_MODEL    : 기본 solar-pro2
//   - LLM_API_KEY  : 제공자 API 키
const DEFAULT_BASE_URL = "https://api.upstage.ai/v1";
const DEFAULT_MODEL = "solar-pro2";

function getConfig() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return {
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    model: process.env.LLM_MODEL || DEFAULT_MODEL,
  };
}

// 언어 코드 → 사람이 읽을 수 있는 이름
const LANGUAGE_NAMES: Record<string, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
};

function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

// 웹소설/웹툰 독자가 자연스럽게 읽을 수 있는 번역을 목표로 한다. (CLAUDE.md)
const SYSTEM_PROMPT = `You are a professional literary translator specialized in Korean web novels and webtoon scripts.

Translate the given text into natural language for global readers.

Rules:
- Preserve the original meaning.
- Preserve character emotions and tone.
- Do not summarize.
- Do not omit sentences.
- Keep line breaks when possible.
- Translate dialogue naturally.
- Avoid overly literal translation.
- If a term is ambiguous, choose the most contextually natural expression.
- The input may contain HTML formatting tags (e.g. <p>, <strong>, <h2>, <ul>, <img>).
  Preserve every HTML tag and its attributes exactly as-is — especially <img> tags, which must be kept unchanged.
  Translate only the human-readable text content between the tags; never translate tag names, attribute names, URLs, or file paths.
- Output only the translated content (with the original HTML structure intact), without any preamble or explanation.`;

export type TranslateParams = {
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  title?: string;
  description?: string;
  genre?: string;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
};

// 작품 텍스트를 번역한다. 실패 시 예외를 던지며, 호출 측에서 상태를 failed로 처리한다.
export async function translateText(params: TranslateParams): Promise<string> {
  const {
    originalText,
    sourceLanguage,
    targetLanguage,
    title = "",
    description = "",
    genre = "",
  } = params;

  const userPrompt = `Source language: ${languageName(sourceLanguage)}
Target language: ${languageName(targetLanguage)}
Genre: ${genre}
Title: ${title}
Description: ${description}

Original text:
${originalText}`;

  const { apiKey, baseUrl, model } = getConfig();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      stream: false,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM 요청 실패 (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const translated = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!translated) {
    throw new Error("번역 결과가 비어 있습니다.");
  }

  return translated;
}
