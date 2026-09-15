
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const options = [
  "💡 I have an idea",
  "📚 I want to learn",
  "✍️ I need help writing",
  "💻 I need help coding",
  "🧠 I have a question",
  "🌙 I feel tired",
];

/* =========================
   TALKITIVE LOGO
========================= */

function TalktiveLogo({
  className = "",
}: {
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} rounded-2xl bg-blue-500 flex items-center justify-center text-black font-black shadow-[0_0_25px_rgba(0,140,255,0.45)]`}
      >
        T
      </div>
    );
  }

  return (
    <img
      src="/ChatGPT Image Sep 13, 2026, 09_07_41 AM.png"
      alt="Talktive"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

export default function Home() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [memory, setMemory] = useState<string[]>([]);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) || null;

  /* =========================
     AUTH CHECK
  ========================= */

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkAuth();
  }, []);

  /* =========================
     LOAD SAVED DATA
  ========================= */

  useEffect(() => {
    if (checkingAuth) return;

    try {
      const savedChats = localStorage.getItem("talktive_chats");
      const savedMemory = localStorage.getItem("talktive_memory");

      if (savedChats) {
        const parsed = JSON.parse(savedChats);

        if (Array.isArray(parsed)) {
          setChats(parsed);

          if (parsed.length > 0) {
            setActiveChatId(parsed[0].id);
          }
        }
      }

      if (savedMemory) {
        const parsedMemory = JSON.parse(savedMemory);

        if (Array.isArray(parsedMemory)) {
          setMemory(parsedMemory);
        }
      }
    } catch (error) {
      console.error("Talktive storage error:", error);
    }
  }, [checkingAuth]);

  /* =========================
     SAVE DATA
  ========================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "talktive_chats",
        JSON.stringify(chats)
      );
    } catch {}
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "talktive_memory",
        JSON.stringify(memory)
      );
    } catch {}
  }, [memory]);

  /* =========================
     RECORDING TIMER
  ========================= */

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recording]);

  /* =========================
     NEW CHAT
  ========================= */

  function createNewChat() {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New conversation",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput("");
  }

  /* =========================
     MEMORY
  ========================= */

  function addMemory(text: string) {
    const memoryText = text
      .replace(/^remember\s*/i, "")
      .replace(/^please remember\s*/i, "")
      .replace(/^don't forget\s*/i, "")
      .trim();

    if (!memoryText) return;

    setMemory((prev) => {
      if (prev.includes(memoryText)) {
        return prev;
      }

      return [...prev, memoryText];
    });
  }

  function handleMemoryCommand(text: string) {
    const lower = text.toLowerCase();

    if (
      lower.startsWith("remember ") ||
      lower.startsWith("please remember ") ||
      lower.startsWith("don't forget ")
    ) {
      addMemory(text);
      return true;
    }

    return false;
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  async function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();

    if (!text || loading) return;

    let chatId = activeChatId;
    let currentMessages: Message[] = [];

    if (!chatId) {
      chatId = Date.now().toString();

      const newMessage: Message = {
        role: "user",
        text,
      };

      currentMessages = [newMessage];

      const newChat: Chat = {
        id: chatId,
        title: text.slice(0, 35),
        messages: currentMessages,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      const currentChat = chats.find(
        (chat) => chat.id === chatId
      );

      currentMessages = [
        ...(currentChat?.messages || []),
        {
          role: "user",
          text,
        },
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title:
                  chat.messages.length === 0
                    ? text.slice(0, 35)
                    : chat.title,
                messages: currentMessages,
              }
            : chat
        )
      );
    }

    setInput("");

    /* MEMORY COMMAND */

    if (handleMemoryCommand(text)) {
      const assistantMessage: Message = {
        role: "assistant",
        text: "Got it — I'll remember that. 🧠",
      };

      const finalMessages = [
        ...currentMessages,
        assistantMessage,
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/Chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          messages: currentMessages,
          memory,
        }),
      });

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Talktive API request failed"
        );
      }

      const assistantText =
        data?.reply ||
        data?.response ||
        data?.message ||
        "Sorry, I couldn't generate a response right now.";

      const finalMessages: Message[] = [
        ...currentMessages,
        {
          role: "assistant",
          text: assistantText,
        },
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Talktive response error:", error);

      const finalMessages: Message[] = [
        ...currentMessages,
        {
          role: "assistant",
          text:
            "I'm having trouble connecting right now. Please try again. 💙",
        },
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     VOICE RECORDING
  ========================= */

  async function startRecording() {
    if (loading) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Your browser does not support microphone access.");
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        stream
          .getTracks()
          .forEach((track) => track.stop());

        await sendVoiceMessage(audioBlob);
      };

      recorder.start();

      setRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Microphone permission is required.");
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
    setRecordingTime(0);
  }

  /* =========================
     SEND VOICE MESSAGE
  ========================= */

  async function sendVoiceMessage(audioBlob: Blob) {
    if (loading) return;

    let chatId = activeChatId;
    let currentMessages: Message[] = [];

    const voiceMessage: Message = {
      role: "user",
      text: "🎙️ Voice message",
    };

    if (!chatId) {
      chatId = Date.now().toString();

      currentMessages = [voiceMessage];

      const newChat: Chat = {
        id: chatId,
        title: "Voice message",
        messages: currentMessages,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(chatId);
    } else {
      const currentChat = chats.find(
        (chat) => chat.id === chatId
      );

      currentMessages = [
        ...(currentChat?.messages || []),
        voiceMessage,
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: currentMessages,
              }
            : chat
        )
      );
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        "voice.webm"
      );

      formData.append(
        "messages",
        JSON.stringify(currentMessages)
      );

      formData.append(
        "memory",
        JSON.stringify(memory)
      );

      const response = await fetch("/api/Chats", {
        method: "POST",
        body: formData,
      });

      let data: any = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Voice request failed"
        );
      }

      const assistantText =
        data?.reply ||
        data?.response ||
        data?.message ||
        "I received your voice message. 🎙️";

      const finalMessages = [
        ...currentMessages,
        {
          role: "assistant" as const,
          text: assistantText,
        },
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Voice response error:", error);

      const finalMessages = [
        ...currentMessages,
        {
          role: "assistant" as const,
          text:
            "I couldn't process the voice message right now. 🎙️",
        },
      ];

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: finalMessages,
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CLEAR MEMORY
  ========================= */

  function clearMemory() {
    setMemory([]);
    localStorage.removeItem("talktive_memory");
  }

  /* =========================
     TIME
  ========================= */

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }

  /* =========================
     AUTH LOADING SCREEN
  ========================= */

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <TalktiveLogo className="w-20 h-20 mx-auto mb-5" />

          <p className="text-blue-400 font-semibold">
            Talktive is loading... 💙
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-black text-white flex">
      {/* SIDEBAR */}

      <aside className="hidden md:flex w-72 border-r border-blue-500/20 bg-black flex-col">
        <div className="p-5 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <TalktiveLogo className="w-10 h-10" />

            <h1 className="text-xl font-bold tracking-tight">
              Talktive
            </h1>
          </div>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={createNewChat}
            className="w-full rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-3 text-left font-semibold transition"
          >
            ＋ New Chat
          </button>
        </div>

        <div className="px-4">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-3">
            Recent Chats
          </p>

          <div className="space-y-1">
            {chats.length === 0 ? (
              <p className="text-sm text-gray-500 px-2">
                No recent chats.
              </p>
            ) : (
              chats.slice(0, 8).map((chat) => (
                <button
                  type="button"
                  key={chat.id}
                  onClick={() =>
                    setActiveChatId(chat.id)
                  }
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition truncate ${
                    activeChatId === chat.id
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-blue-500/10"
                  }`}
                >
                  {chat.messages[0]?.text ||
                    chat.title}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 px-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
              🧠 Memory
            </p>

            {memory.length > 0 && (
              <button
                type="button"
                onClick={clearMemory}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>

          {memory.length === 0 ? (
            <p className="text-sm text-gray-600">
              No saved memories.
            </p>
          ) : (
            <div className="space-y-2">
              {memory.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-sm text-gray-300"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR BRANDING */}

        <div className="p-5 border-t border-blue-500/20 text-center">
          <p className="text-xs text-gray-600 mb-1">
            Talktive by
          </p>

          <p className="text-sm text-blue-400 font-bold tracking-wide">
            LEXVAIN
          </p>

          <p className="text-xs text-gray-500 mt-2">
            Sataish Jamshaid
          </p>

          <p className="text-[10px] text-gray-600 mt-0.5">
            CEO · Founder & Visionary
          </p>
        </div>
      </aside>

      {/* MAIN AREA */}

      <section className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* HEADER */}

        <header className="h-16 border-b border-blue-500/20 flex items-center justify-between px-4 md:px-8 bg-black">
          <div className="flex items-center gap-3">
            <TalktiveLogo className="w-8 h-8 md:hidden" />

            <div>
              <p className="font-bold text-white">
                {activeChat?.title ||
                  "New conversation"}
              </p>

              <p className="text-xs text-blue-400 font-medium">
                Talktive AI
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-black">
            S
          </div>
        </header>

        {/* CHAT */}

        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
          {!activeChat ||
          activeChat.messages.length === 0 ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
              <TalktiveLogo className="w-24 h-24 mb-7" />

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                What brings you here?
              </h2>

              <p className="mt-4 text-gray-400 font-medium">
                Choose what you need, or simply start
                talking.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                {options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() =>
                      sendMessage(option)
                    }
                    disabled={loading}
                    className="rounded-xl border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/50 px-4 py-4 text-left font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {activeChat.messages.map(
                (message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                        message.role === "user"
                          ? "bg-blue-500/15 border border-blue-500/25 text-white"
                          : "bg-white/[0.03] border border-white/10 text-gray-200"
                      }`}
                    >
                      {message.role ===
                        "assistant" && (
                        <p className="text-xs text-blue-400 font-bold mb-2 tracking-wider">
                          TALKTIVE
                        </p>
                      )}

                      <p className="whitespace-pre-wrap leading-7 font-medium">
                        {message.text}
                      </p>
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
                    <p className="text-blue-400 font-semibold">
                      Talktive is thinking... 🧠
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INPUT */}

        <div className="px-4 md:px-10 pb-5">
          <div className="max-w-3xl mx-auto">
            <div className="mb-3 text-center">
              <span className="text-xs text-blue-400 font-semibold tracking-wide">
                Talktive AI
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-blue-500/30 bg-black p-2 shadow-[0_0_30px_rgba(0,100,255,0.08)]">
              <button
                type="button"
                onClick={
                  recording
                    ? stopRecording
                    : startRecording
                }
                disabled={loading}
                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-bold transition ${
                  recording
                    ? "bg-blue-500 text-black"
                    : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                } disabled:opacity-40`}
                title={
                  recording
                    ? "Stop recording"
                    : "Voice message"
                }
              >
                {recording ? "■" : "🎙️"}
              </button>

              {recording && (
                <span className="text-sm text-blue-400 font-semibold">
                  {formatTime(recordingTime)}
                </span>
              )}

              <input
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask Talktive anything..."
                className="flex-1 bg-transparent outline-none px-2 text-white placeholder:text-gray-600 font-medium min-w-0"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 shrink-0 rounded-xl bg-blue-500 text-black font-bold disabled:opacity-30 hover:bg-blue-400 transition"
              >
                ↑
              </button>
            </div>

            <p className="text-center text-xs text-gray-600 mt-3">
              Talktive can make mistakes. Check
              important information.
            </p>
          </div>
        </div>

        {/* FINAL FOOTER */}

        <footer className="border-t border-blue-500/15 py-6 px-4 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-sm md:text-base text-white font-semibold tracking-tight">
              Talktive by{" "}
              <span className="text-blue-400">
                LEXVAIN
              </span>
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Sataish Jamshaid
            </p>

            <p className="text-xs text-blue-400 font-semibold tracking-wide mt-0.5">
              CEO · Founder & Visionary
            </p>

            <p className="text-xs text-gray-500 italic mt-1">
              Officially known as “Miss Worship”
            </p>

            <p className="text-[11px] text-gray-600 mt-3">
              © 2026 LEXVAIN
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

