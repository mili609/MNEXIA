"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ConversationSidebar } from "@/components/chat/sidebar";
import { MessageInput } from "@/components/chat/message-input";
import { MessageList } from "@/components/chat/message-list";
import {
  type ChatMessage,
  type ConversationSummary,
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "@/lib/api";

type Props = {
  initialConversations: ConversationSummary[];
  initialError: string | null;
  llmProvider: "openai" | "demo" | null;
};

export function ChatWorkspace({ initialConversations, initialError, llmProvider }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [conversationsError, setConversationsError] = useState<string | null>(initialError);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Mirrors `activeId` for use inside the streaming callback below, which is
  // defined once but reads the *current* conversation id at call time.
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      setConversations(list);
      setConversationsError(null);
    } catch (error) {
      setConversationsError(error instanceof Error ? error.message : "Could not load conversations");
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setSendError(null);
    setStreamingText("");
    setMessagesLoading(true);
    try {
      const loaded = await getMessages(id);
      setMessages(loaded);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not load this conversation");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    setSendError(null);
    try {
      const conversation = await createConversation();
      setConversations((prev) => [conversation, ...prev]);
      setActiveId(conversation.id);
      setMessages([]);
      setStreamingText("");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not create a conversation");
    }
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      const conversationId = activeIdRef.current;
      if (!conversationId) return;

      setSendError(null);
      const optimisticUserMessage: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMessage]);
      setIsSending(true);
      setStreamingText("");

      let assembled = "";
      await sendMessage(conversationId, content, {
        onDelta: (chunk) => {
          assembled += chunk;
          setStreamingText(assembled);
        },
        onDone: (messageId) => {
          setMessages((prev) => [
            ...prev,
            { id: messageId, role: "assistant", content: assembled, created_at: new Date().toISOString() },
          ]);
          setStreamingText("");
          setIsSending(false);
          refreshConversations();
        },
        onError: (message) => {
          setSendError(message);
          setStreamingText("");
          setIsSending(false);
        },
      });
    },
    [refreshConversations],
  );

  return (
    <div className="flex h-screen">
      <ConversationSidebar
        conversations={conversations}
        error={conversationsError}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={startNewConversation}
      />
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b p-3">
          <h1 className="text-sm font-semibold tracking-tight">MNEXIA</h1>
          {llmProvider === "demo" && (
            <Badge variant="outline" title="Replies are generated locally, not by a live OpenAI call">
              Demo Mode
            </Badge>
          )}
        </header>
        <MessageList
          messages={messages}
          streamingText={streamingText}
          isSending={isSending}
          loading={messagesLoading}
          hasActiveConversation={activeId !== null}
        />
        {sendError && (
          <div className="mx-3 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {sendError}
          </div>
        )}
        <MessageInput onSend={handleSend} disabled={!activeId || isSending} />
      </main>
    </div>
  );
}
