"use client";

import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  conversations: ConversationSummary[];
  error: string | null;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function ConversationSidebar({ conversations, error, activeId, onSelect, onNew }: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="p-3">
        <Button className="w-full" onClick={onNew}>
          New conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {error && <p className="px-2 py-4 text-sm text-destructive">{error}</p>}
        {!error && conversations.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet.</p>
        )}
        <ul className="space-y-1">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  "w-full truncate rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                  activeId === conversation.id && "bg-muted font-medium",
                )}
              >
                {conversation.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
