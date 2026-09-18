"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

type WhisperTranscriber = any;

const options = [
  "💡 I have an idea",
  "📚 I want to learn",
  "✍️ I need help writing",
  "💻 I need help coding",
  "🧠 I have a question",
  "🌙 I feel tired",
];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

function TalktiveLogo() {
  return (
    <img
      src="/talktive-icon.png"
      alt="Talktive"
      className="h-10 w-10 rounded-xl object-cover"
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
  const [voiceProcessing, setVoiceProcessing] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const transcriberRef =
    useRef<WhisperTranscriber | null>(null);

  const transcriberLoadingRef =
    useRef<Promise<WhisperTranscriber> | null>(null);

  /* =========================
     AUTH
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setCheckingAuth(false);
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     LOAD SAVED DATA
  ========================= */

  useEffect(() => {
    try {
      const savedChats =
        localStorage.getItem("talktive_chats");

      const savedMemory =
        localStorage.getItem("talktive_memory");

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
      console.error(
        "Talktive storage error:",
        error
      );
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {});
    }
  }, []);

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
     ACTIVE CHAT
  ========================= */

  const activeChat =
    chats.find(
      (chat) => chat.id === activeChatId
    ) || null;

  const messages =
    activeChat?.messages || [];

  /* =========================
     CHAT HELPERS
  ========================= */

  function createNewChat() {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
    };

    setChats((prev) => [
      newChat,
      ...prev,
    ]);

    setActiveChatId(newChat.id);
    setInput("");
    setSidebarOpen(false);
  }

  function updateChatMessages(
    chatId: string,
    newMessages: Message[]
  ) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
            }
          : chat
      )
    );
  }

  function updateChatTitle(
    chatId: string,
    text: string
  ) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title:
                text.length > 32
                  ? text.slice(0, 32) + "..."
                  : text,
            }
          : chat
      )
    );
  }

  function deleteChat(chatId: string) {
    setChats((prev) => {
      const remaining = prev.filter(
        (chat) => chat.id !== chatId
      );

      setActiveChatId((currentId) => {
        if (currentId !== chatId) {
          return currentId;
        }

        return remaining.length > 0
          ? remaining[0].id
          : null;
      });

      return remaining;
    });

    setInput("");
  }

  /* =========================
     MEMORY
  ========================= */

  function saveMemory(text: string) {
    const clean = text
      .replace(
        /^(remember|please remember|don't forget|dont forget)\s*/i,
        ""
      )
      .trim();

    if (!clean) return;

    setMemory((prev) => {
      const alreadyExists = prev.some(
        (item) =>
          item.toLowerCase() ===
          clean.toLowerCase()
      );

      if (alreadyExists) {
        return prev;
      }

      return [
        ...prev,
        clean,
      ];
    });
  }

  function isMemoryCommand(text: string) {
    return /^(remember|please remember|don't forget|dont forget)\b/i.test(
      text.trim()
    );
  }

  function isClearMemoryCommand(
    text: string
  ) {
    return /^(clear|delete|forget|remove)\s+(my\s+)?memory$/i.test(
      text.trim()
    );
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  async function sendMessage(
    customText?: string
  ) {
    const text = (
      customText ?? input
    ).trim();

    if (
      !text ||
      loading ||
      voiceProcessing
    ) {
      return;
    }

    setInput("");
    setLoading(true);

    /*
      IMPORTANT:
      We create/read the chat using the
      functional state update so the first
      message cannot disappear because of
      stale React state.
    */

    let chatId = activeChatId;

    if (!chatId) {
      chatId = Date.now().toString();

      const newChat: Chat = {
        id: chatId,
        title:
          text.length > 32
            ? text.slice(0, 32) + "..."
            : text,
        messages: [],
      };

      setChats((prev) => [
        newChat,
        ...prev,
      ]);

      setActiveChatId(chatId);
    }

    const userMessage: Message = {
      role: "user",
      text,
    };

    let currentMessages: Message[] = [];

    /*
      Read the current chat from the latest
      state. For a brand-new chat there are
      no previous messages.
    */

    if (activeChatId) {
      const currentChat =
        chats.find(
          (chat) =>
            chat.id === activeChatId
        );

      currentMessages =
        currentChat?.messages || [];
    }

    const updatedMessages: Message[] = [
      ...currentMessages,
      userMessage,
    ];

    /*
      Add the user's message.
      This also handles the first message
      in a brand-new chat.
    */

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title:
                chat.messages.length === 0
                  ? text.length > 32
                    ? text.slice(0, 32) + "..."
                    : text
                  : chat.title,
              messages:
                updatedMessages,
            }
          : chat
      )
    );

    /* =========================
       MEMORY COMMAND
    ========================= */

    if (isMemoryCommand(text)) {
      saveMemory(text);

      const reply: Message = {
        role: "assistant",
        text:
          "Haan yrr 🧠💙 yaad rakh liya. Main is baat ko future chats mein yaad rakhunga. ✨",
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  reply,
                ],
              }
            : chat
        )
      );

      setLoading(false);
      return;
    }

    /* =========================
       CLEAR MEMORY
    ========================= */

    if (isClearMemoryCommand(text)) {
      setMemory([]);

      const reply: Message = {
        role: "assistant",
        text:
          "Done yrr 🧹💙 tumhari saved memory clear kar di.",
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  reply,
                ],
              }
            : chat
        )
      );

      setLoading(false);
      return;
    }

    /* =========================
       AI REQUEST
    ========================= */

    try {
      console.log(
        "Talktive sending message:",
        text
      );

      const response =
        await fetch("/api/Chats", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: text,
            messages:
              updatedMessages,
            memory,
          }),
        });

      const data =
        await response.json();

      console.log(
        "Talktive API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Talktive API request failed."
        );
      }

      const replyText =
        data?.reply ||
        data?.response ||
        data?.answer ||
        data?.message ||
        "";

      if (!replyText) {
        throw new Error(
          "Talktive returned an empty response."
        );
      }

      const assistantMessage: Message = {
        role: "assistant",
        text: replyText,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  assistantMessage,
                ],
              }
            : chat
        )
      );
    } catch (error) {
      console.error(
        "Talktive API error:",
        error
      );

      const errorMessage: Message = {
        role: "assistant",
        text:
          "Yrr 😭💙 abhi connection mein thora issue aa gaya. Ek baar phir try karo.",
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  errorMessage,
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     WHISPER
  ========================= */

  async function getWhisper() {
    if (transcriberRef.current) {
      return transcriberRef.current;
    }

    if (transcriberLoadingRef.current) {
      return transcriberLoadingRef.current;
    }

    transcriberLoadingRef.current =
      (async () => {
        const {
          pipeline,
        } = await import(
          "@huggingface/transformers"
        );

        const supportsWebGPU =
          typeof navigator !==
            "undefined" &&
          "gpu" in navigator;

        const device =
          supportsWebGPU
            ? "webgpu"
            : "wasm";

        console.log(
          "Talktive Whisper loading:",
          device
        );

        const transcriber =
          await pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny",
            {
              device,
            }
          );

        transcriberRef.current =
          transcriber;

        return transcriber;
      })();

    try {
      return await transcriberLoadingRef.current;
    } finally {
      transcriberLoadingRef.current =
        null;
    }
  }

  /* =========================
     AUDIO CONVERSION
  ========================= */

  async function audioBlobToFloat32(
    blob: Blob
  ) {
    const arrayBuffer =
      await blob.arrayBuffer();

    const AudioContextClass =
      window.AudioContext ||
      (window as any)
        .webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error(
        "AudioContext unavailable."
      );
    }

    const audioContext =
      new AudioContextClass();

    try {
      const audioBuffer =
        await audioContext.decodeAudioData(
          arrayBuffer
        );

      const sourceSampleRate =
        audioBuffer.sampleRate;

      const sourceChannels =
        audioBuffer.numberOfChannels;

      const sourceLength =
        audioBuffer.length;

      const mono =
        new Float32Array(
          sourceLength
        );

      for (
        let channel = 0;
        channel < sourceChannels;
        channel++
      ) {
        const channelData =
          audioBuffer.getChannelData(
            channel
          );

        for (
          let i = 0;
          i < sourceLength;
          i++
        ) {
          mono[i] +=
            channelData[i] /
            sourceChannels;
        }
      }

      const targetSampleRate =
        16000;

      if (
        sourceSampleRate ===
        targetSampleRate
      ) {
        return mono;
      }

      const newLength =
        Math.max(
          1,
          Math.round(
            mono.length *
              (targetSampleRate /
                sourceSampleRate)
          )
        );

      const resampled =
        new Float32Array(
          newLength
        );

      const ratio =
        sourceSampleRate /
        targetSampleRate;

      for (
        let i = 0;
        i < newLength;
        i++
      ) {
        const position =
          i * ratio;

        const left =
          Math.floor(position);

        const right =
          Math.min(
            left + 1,
            mono.length - 1
          );

        const weight =
          position - left;

        resampled[i] =
          mono[left] *
            (1 - weight) +
          mono[right] *
            weight;
      }

      return resampled;
    } finally {
      await audioContext
        .close()
        .catch(() => {});
    }
  }

  /* =========================
     TRANSCRIBE
  ========================= */

  async function transcribeAudio(
    blob: Blob
  ) {
    setVoiceProcessing(true);

    try {
      console.log(
        "Talktive Whisper preparing audio..."
      );

      const audio =
        await audioBlobToFloat32(
          blob
        );

      console.log(
        "Talktive Whisper audio ready:",
        audio.length
      );

      const transcriber =
        await getWhisper();

      console.log(
        "Talktive Whisper transcribing..."
      );

      const result =
        await transcriber(
          audio,
          {
            chunk_length_s: 30,
            stride_length_s: 5,
          }
        );

      const text =
        typeof result?.text ===
        "string"
          ? result.text.trim()
          : "";

      console.log(
        "Talktive Whisper result:",
        text
      );

      if (!text) {
        alert(
          "Yrr 😭 voice clear nahi mili. Dobara thora clearly bolo."
        );
        return;
      }

      await sendMessage(text);
    } catch (error) {
      console.error(
        "Whisper transcription error:",
        error
      );

      alert(
        "Yrr 😭 voice process nahi ho saki. Dobara try karo."
      );
    } finally {
      setVoiceProcessing(false);
    }
  }

  /* =========================
     START RECORDING
  ========================= */

  async function startRecording() {
    if (
      recording ||
      voiceProcessing ||
      loading
    ) {
      return;
    }

    try {
      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        alert(
          "Yrr 😭 tumhare browser mein microphone support available nahi hai."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];

      const mimeType =
        mimeTypes.find((type) =>
          MediaRecorder.isTypeSupported(
            type
          )
        );

      const recorder = mimeType
        ? new MediaRecorder(
            stream,
            {
              mimeType,
            }
          )
        : new MediaRecorder(
            stream
          );

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current =
        [];

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      recorder.onstop =
        async () => {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          const finalMimeType =
            mimeType ||
            recorder.mimeType ||
            "audio/webm";

          const blob =
            new Blob(
              audioChunksRef.current,
              {
                type: finalMimeType,
              }
            );

          audioChunksRef.current =
            [];

          if (blob.size > 0) {
            await transcribeAudio(
              blob
            );
          }
        };

      recorder.onerror = (
        event
      ) => {
        console.error(
          "MediaRecorder error:",
          event
        );
      };

      recorder.start(250);

      setRecording(true);
      setRecordingTime(0);

      if (timerRef.current) {
        clearInterval(
          timerRef.current
        );
      }

      timerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Yrr 😭 microphone access nahi mil raha. Browser mein mic allow hona chahiye."
      );
    }
  }

  /* =========================
     STOP RECORDING
  ========================= */

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      setRecording(false);

      if (timerRef.current) {
        clearInterval(
          timerRef.current
        );

        timerRef.current =
          null;
      }

      return;
    }

    recorder.stop();

    setRecording(false);

    if (timerRef.current) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  }

  /* =========================
     TIMER
  ========================= */

  function formatRecordingTime(
    seconds: number
  ) {
    const minutes =
      Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");

    const secs =
      (seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${secs}`;
  }

  /* =========================
     OPTION BUTTON
  ========================= */

  async function handleOption(
    option: string
  ) {
    await sendMessage(option);
  }

  /* =========================
     LOADING AUTH
  ========================= */

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          </div>

          <p className="text-sm text-blue-300">
            Loading Talktive...
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="flex h-screen">

        {/* MOBILE OVERLAY */}

        {sidebarOpen && (
          <button
            aria-label="Close sidebar"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
          />
        )}

        {/* =====================
            SIDEBAR
        ===================== */}

        <aside
          className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-[280px] border-r border-white/10 bg-[#050505] flex flex-col transform transition-transform duration-200 ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-white/10">

            <div className="flex items-center gap-3 mb-5">
              <TalktiveLogo />

              <div>
                <h1 className="text-lg font-black tracking-tight">
                  Talktive
                </h1>

                <p className="text-[11px] text-blue-400">
                  AI conversation space
                </p>
              </div>
            </div>

            <button
              onClick={
                createNewChat
              }
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition px-4 py-3 font-bold text-sm"
            >
              ＋ New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">

            <div className="px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-white/35">
              Recent Chats
            </div>

            <div className="space-y-1">
              {chats.length === 0 ? (
                <p className="px-2 py-4 text-xs text-white/30">
                  No chats yet.
                </p>
              ) : (
                chats.map(
                  (chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-2 rounded-xl transition ${
                        activeChatId ===
                        chat.id
                          ? "bg-blue-600/15 border border-blue-500/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setActiveChatId(
                            chat.id
                          );

                          setSidebarOpen(
                            false
                          );
                        }}
                        className="flex-1 min-w-0 text-left px-3 py-3"
                      >
                        <p className="truncate text-sm text-white/85">
                          {chat.title}
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          deleteChat(
                            chat.id
                          )
                        }
                        className="mr-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition"
                        aria-label="Delete chat"
                      >
                        ×
                      </button>
                    </div>
                  )
                )
              )}
            </div>

            {/* MEMORY */}

            <div className="mt-6">

              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/35">
                  🧠 Memory
                </span>

                {memory.length >
                  0 && (
                  <button
                    onClick={() =>
                      setMemory([])
                    }
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-2 px-2">
                {memory.length ===
                0 ? (
                  <p className="text-xs text-white/25">
                    Nothing saved yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memory.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-white/55"
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="p-4 border-t border-white/10">
            <div className="rounded-xl bg-blue-600/5 border border-blue-500/10 p-3">

              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                Talktive by LEXVAIN
              </p>

              <p className="mt-2 text-sm font-bold">
                Sataish Jamshaid
              </p>

              <p className="text-xs text-white/45">
                CEO · Founder & Visionary
              </p>

              <p className="mt-1 text-[11px] text-white/35">
                Officially known as “Miss Worship”
              </p>

              <p className="mt-2 text-[10px] text-white/25">
                © 2026 LEXVAIN
              </p>

            </div>
          </div>
        </aside>

        {/* =====================
            MAIN
        ===================== */}

        <section className="flex-1 min-w-0 flex flex-col">

          {/* TOP BAR */}

          <header className="h-16 shrink-0 border-b border-white/10 flex items-center justify-between px-4 md:px-6">

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
                className="md:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center"
                aria-label="Open sidebar"
              >
                ☰
              </button>

              <div className="md:hidden flex items-center gap-2">

                <TalktiveLogo />

                <span className="font-black">
                  Talktive
                </span>

              </div>
            </div>

            <div className="h-9 w-9 rounded-full border border-blue-500/30 bg-blue-600/10 flex items-center justify-center text-sm font-black text-blue-300">
              S
            </div>

          </header>

          {/* =====================
              CHAT AREA
          ===================== */}

          <div className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-4xl px-4 md:px-8 py-6">

              {messages.length ===
              0 ? (

                <div className="min-h-[calc(100vh-190px)] flex flex-col justify-center">

                  <div className="mb-8">

                    <div className="mb-5 inline-flex">

                      <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.12)]">

                        <TalktiveLogo />

                      </div>

                    </div>

                    <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                      What brings you here?
                    </h2>

                    <p className="mt-3 text-white/40 text-sm md:text-base">
                      Choose what you need, or simply start talking.
                    </p>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {options.map(
                      (option) => (
                        <button
                          key={
                            option
                          }
                          onClick={() =>
                            handleOption(
                              option
                            )
                          }
                          disabled={
                            loading ||
                            voiceProcessing
                          }
                          className="group text-left rounded-2xl border border-white/10 bg-white/[0.025] hover:bg-blue-600/[0.08] hover:border-blue-500/30 transition p-4 disabled:opacity-40"
                        >
                          <span className="text-sm font-semibold text-white/80 group-hover:text-white">
                            {option}
                          </span>
                        </button>
                      )
                    )}

                  </div>

                </div>

              ) : (

                <div className="space-y-7 pb-8">

                  {messages.map(
                    (
                      message,
                      index
                    ) => (

                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${
                          message.role ===
                          "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div className="max-w-[88%] md:max-w-[75%] flex flex-col">

                          <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-white/30">
                            {message.role ===
                            "user"
                              ? "YOU"
                              : "TALKTIVE"}
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-3 text-sm md:text-[15px] leading-7 whitespace-pre-wrap ${
                              message.role ===
                              "user"
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white/[0.045] border border-white/10 text-white/85 rounded-bl-md"
                            }`}
                          >
                            {
                              message.text
                            }
                          </div>

                        </div>

                      </div>
                    )
                  )}

                  {/* AI LOADING */}

                  {loading && (
                    <div className="flex justify-start">

                      <div>

                        <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-white/30">
                          TALKTIVE
                        </div>

                        <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.045] px-5 py-4">

                          <div className="flex items-center gap-1.5">

                            <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" />

                            <span
                              className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
                              style={{
                                animationDelay:
                                  "120ms",
                              }}
                            />

                            <span
                              className="h-2 w-2 rounded-full bg-blue-400 animate-bounce"
                              style={{
                                animationDelay:
                                  "240ms",
                              }}
                            />

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* VOICE PROCESSING */}

                  {voiceProcessing && (
                    <div className="flex justify-start">

                      <div>

                        <div className="mb-2 text-[10px] uppercase tracking-widest font-bold text-white/30">
                          TALKTIVE
                        </div>

                        <div className="rounded-2xl rounded-bl-md border border-blue-500/20 bg-blue-600/5 px-4 py-3">

                          <div className="flex items-center gap-3 text-sm text-blue-300">

                            <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />

                            <span>
                              Understanding your voice... 🎙️
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>

          {/* =====================
              INPUT
          ===================== */}

          <div className="shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-xl">

            <div className="mx-auto max-w-4xl px-4 md:px-8 py-4">

              {recording && (
                <div className="mb-3 flex items-center justify-center gap-3 text-xs text-blue-300">

                  <span className="relative flex h-3 w-3">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />

                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />

                  </span>

                  <span>
                    Listening...{" "}
                    {formatRecordingTime(
                      recordingTime
                    )}
                  </span>

                </div>
              )}

              {voiceProcessing && (
                <div className="mb-3 text-center text-xs text-white/40">
                  🎙️ Processing your voice...
                </div>
              )}

              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 focus-within:border-blue-500/40 transition">

                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target
                        .value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      if (
                        !loading &&
                        !voiceProcessing &&
                        input.trim()
                      ) {
                        sendMessage();
                      }
                    }
                  }}
                  disabled={
                    recording ||
                    voiceProcessing ||
                    loading
                  }
                  placeholder="Ask Talktive anything..."
                  rows={1}
                  className="min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-3 py-3 outline-none text-sm text-white placeholder:text-white/25 disabled:opacity-40"
                />

                {/* MIC */}

                <button
                  type="button"
                  onClick={
                    recording
                      ? stopRecording
                      : startRecording
                  }
                  disabled={
                    voiceProcessing ||
                    loading
                  }
                  className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition ${
                    recording
                      ? "bg-red-500/15 border border-red-500/30 text-red-400"
                      : "bg-white/[0.04] border border-white/10 text-white/65 hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-300"
                  } disabled:opacity-40`}
                  aria-label={
                    recording
                      ? "Stop recording"
                      : "Start voice recording"
                  }
                >
                  {recording
                    ? "■"
                    : "🎙️"}
                </button>

                {/* SEND */}

                <button
                  type="button"
                  onClick={() =>
                    sendMessage()
                  }
                  disabled={
                    !input.trim() ||
                    recording ||
                    voiceProcessing ||
                    loading
                  }
                  className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white flex items-center justify-center font-bold transition"
                  aria-label="Send message"
                >
                  ↑
                </button>

              </div>

              <p className="mt-2 text-center text-[10px] text-white/20">
                Talktive can make mistakes. Check important information.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}