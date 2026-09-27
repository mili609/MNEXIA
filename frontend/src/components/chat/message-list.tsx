import type { ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  messages: ChatMessage[];
  streamingText: string;
  isSending: boolean;
  loading: boolean;
  hasActiveConversation: boolean;
};

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
          role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {content}
      </div>
    </div>
  );
}

export function MessageList({ messages, streamingText, isSending, loading, hasActiveConversation }: Props) {
  if (!hasActiveConversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
        <p>Select a conversation, or start a new one to begin chatting with MNEXIA.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>Loading messages…</p>
      </div>
    );
  }

  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
        <p>Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <Bubble key={message.id} role={message.role} content={message.content} />
      ))}
      {isSending && streamingText && <Bubble role="assistant" content={streamingText} />}
      {isSending && !streamingText && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">Thinking…</div>
        </div>
      )}
    </div>
  );
}
