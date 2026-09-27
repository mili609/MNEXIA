import { ChatWorkspace } from "@/components/chat/workspace";
import { getConfig, listConversations, type ConversationSummary } from "@/lib/api";

export default async function Home() {
  let initialConversations: ConversationSummary[] = [];
  let initialError: string | null = null;

  try {
    initialConversations = await listConversations();
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Could not load conversations";
  }

  let llmProvider: "openai" | "demo" | null = null;
  try {
    llmProvider = (await getConfig()).llm_provider;
  } catch {
    llmProvider = null; // backend unreachable — the conversations error above already covers this
  }

  return (
    <ChatWorkspace
      initialConversations={initialConversations}
      initialError={initialError}
      llmProvider={llmProvider}
    />
  );
}
