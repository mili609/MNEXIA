export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type AppConfig = {
  llm_provider: "openai" | "demo";
};

async function parseErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // Response wasn't JSON — fall through to the generic message.
  }
  return fallback;
}

export async function getConfig(): Promise<AppConfig> {
  const response = await fetch(`${API_URL}/api/config`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Could not load app config"));
  }
  return response.json();
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const response = await fetch(`${API_URL}/api/conversations`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Could not load conversations"));
  }
  return response.json();
}

export async function createConversation(): Promise<ConversationSummary> {
  const response = await fetch(`${API_URL}/api/conversations`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Could not create a conversation"));
  }
  return response.json();
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await parseErrorDetail(response, "Could not load messages"));
  }
  return response.json();
}

export type StreamHandlers = {
  onDelta: (chunk: string) => void;
  onDone: (messageId: string) => void;
  onError: (message: string) => void;
};

type StreamEvent = {
  type?: "delta" | "done" | "error";
  content?: string;
  message_id?: string;
  message?: string;
};

function handleServerSentEvent(rawEvent: string, handlers: StreamHandlers): void {
  const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
  if (!dataLine) return;

  const jsonText = dataLine.slice("data:".length).trim();
  if (!jsonText) return;

  let event: StreamEvent;
  try {
    event = JSON.parse(jsonText);
  } catch {
    return;
  }

  if (event.type === "delta" && event.content) {
    handlers.onDelta(event.content);
  } else if (event.type === "done" && event.message_id) {
    handlers.onDone(event.message_id);
  } else if (event.type === "error" && event.message) {
    handlers.onError(event.message);
  }
}

/**
 * Sends a message and streams the assistant's reply via SSE-over-fetch
 * (EventSource can't send a POST body, so the stream is parsed by hand).
 * Never throws — every failure mode is reported through `handlers.onError`.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (error) {
    handlers.onError(error instanceof Error ? error.message : "Could not reach the backend");
    return;
  }

  if (!response.ok) {
    handlers.onError(await parseErrorDetail(response, `Request failed with status ${response.status}`));
    return;
  }

  if (!response.body) {
    handlers.onError("This browser does not support streaming responses");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleServerSentEvent(rawEvent, handlers);
        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    handlers.onError(error instanceof Error ? error.message : "Streaming was interrupted");
  }
}
