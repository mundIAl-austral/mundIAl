export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  refused: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function sendChatMessage(
  messages: ChatMessage[],
  timezone: string,
): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, timezone }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<ChatResponse>;
}
