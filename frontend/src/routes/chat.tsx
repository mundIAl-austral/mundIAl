import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "@/api/chat";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Preguntame sobre partidos del Mundial 2026: equipos, grupos u horarios. No respondo otros temas.",
};

function ChatPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const timezone =
    profile?.timezone ?? "America/Argentina/Buenos_Aires";

  const { mutate, isPending } = useMutation({
    mutationFn: (history: ChatMessage[]) => sendChatMessage(history, timezone),
    onSuccess: (data, sentMessages) => {
      setMessages([...sentMessages, { role: "assistant", content: data.message }]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isPending) return;

    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(history);
    setInput("");
    mutate(history);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar
        rightSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: "/results" })}
            className="gap-1.5 rounded-full border-border bg-[color:var(--surface-soft)] px-4 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-4 pt-6">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-[color:var(--surface-medium)] text-primary">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl text-foreground">Chat de partidos</h1>
            <p className="text-sm text-muted-foreground">
              Solo fase de grupos del Mundial 2026.
            </p>
          </div>
        </div>

        <div
          ref={listRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
        >
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={
                msg.role === "user"
                  ? "ml-8 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "mr-8 rounded-2xl rounded-tl-sm border border-border bg-[color:var(--surface-soft)] px-4 py-3 text-sm leading-6 text-foreground"
              }
            >
              {msg.content}
            </div>
          ))}
          {isPending && (
            <p className="text-sm text-muted-foreground">Pensando…</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 flex gap-2 pb-[env(safe-area-inset-bottom)]"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej. ¿Cuándo juega Argentina?"
            className="h-12 flex-1 rounded-2xl"
            disabled={isPending}
            maxLength={2000}
          />
          <Button
            type="submit"
            disabled={isPending || !input.trim()}
            className="h-12 w-12 shrink-0 rounded-2xl rounded-tl-xs p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}
