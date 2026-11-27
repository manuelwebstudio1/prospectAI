"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = { role: "bot" | "user"; text: string };

const starters = ["What is ProspectAI?", "How does it work?", "What are the plans?"];

export function GrokBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi — I am Grok, the ProspectAI bot. Ask me about the product, pricing, or how to start a workspace.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as { reply?: string };
      setMessages((current) => [
        ...current,
        { role: "bot", text: data.reply ?? "I could not reply just then. Try again." },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "bot", text: "The chat is offline for a moment. Refresh the page and try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open ? (
        <section className="pointer-events-auto flex h-[min(32rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.4rem] bg-white shadow-[0_18px_50px_rgba(80,50,30,0.16)] ring-1 ring-black/5">
          <header className="flex items-center justify-between bg-[#e85a2a] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Grok</p>
              <p className="text-[11px] text-white/80">ProspectAI bot</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/15"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f6f1eb] px-3 py-3">
            {messages.map((item, index) => (
              <p
                key={`${item.role}-${index}`}
                className={
                  item.role === "user"
                    ? "ml-8 whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#e85a2a] px-3 py-2 text-sm text-white"
                    : "mr-8 whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-[#1c1917] shadow-sm"
                }
              >
                {item.text}
              </p>
            ))}
            {pending ? <p className="text-xs text-[#9a9289]">Grok is typing…</p> : null}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-[#eadfd6] bg-white px-3 py-2">
            {starters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => send(item)}
                className="rounded-full border border-[#eadfd6] px-2.5 py-1 text-[11px] text-[#3f3a36] hover:bg-[#f6f1eb]"
              >
                {item}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2 border-t border-[#eadfd6] bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Grok…"
              className="h-10 flex-1 rounded-full border border-[#eadfd6] bg-[#f6f1eb] px-4 text-sm outline-none focus:border-[#e85a2a]"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e85a2a] text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e85a2a] text-white shadow-[0_12px_30px_rgba(232,90,42,0.4)]"
        aria-label={open ? "Close Grok" : "Open Grok bot"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
