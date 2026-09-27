"use client";

import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  onSend: (content: string) => void;
  disabled: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Message MNEXIA…"
        rows={2}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
      />
      <Button onClick={submit} disabled={disabled || !value.trim()}>
        Send
      </Button>
    </div>
  );
}
