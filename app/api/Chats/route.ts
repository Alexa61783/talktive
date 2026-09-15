
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const cleanReply = (text: string) => {
  let cleaned = text.trim();

  cleaned = cleaned.replace(
    /^\s*(case_format|response|answer|reply|output)\s*:\s*/i,
    ""
  );

  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }

  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned.trim();
};

/*
 * OFFICIAL TALKTIVE CREATOR RESPONSE
 */

const creatorResponse =
  "Yes, I was created by Sataish Jamshaid, officially known as Miss Worship — CEO, Founder & Visionary of LEXVAIN, an AI software products company. I’m Talktive, proudly created under the vision of Sataish Jamshaid. ✨";

/*
 * CREATOR QUESTION DETECTION
 */

const isCreatorQuestion = (message: string) => {
  const text = message
    .toLowerCase()
    .replace(/[?!.,'"`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const creatorPatterns = [
    "who created you",
    "who made you",
    "who built you",
    "who developed you",
    "who is your creator",
    "who is your founder",
    "who is behind you",
    "who is behind talktive",
    "who made talktive",
    "who created talktive",
    "who built talktive",
    "who developed talktive",
    "who founded talktive",
    "who owns talktive",
    "tell me about your creator",
    "tell me about your founder",
    "tell me about the person who created you",
    "tell me who created you",
    "tell me who made you",
    "tell me who built you",
    "your creator",
    "your founder",
    "your maker",
    "your developer",
    "your creator name",
    "creator of talktive",
    "founder of talktive",
    "maker of talktive",
    "developer of talktive",
    "who is sataish jamshaid",
    "who is miss worship",
  ];

  return creatorPatterns.some((pattern) =>
    text.includes(pattern)
  );
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message = "",
      history = [],
      memory = [],
      audio = null,
      audioMimeType = "audio/webm",
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    /*
     * CREATOR QUESTIONS
     *
     * These are handled before Gemini so the
     * official creator identity cannot be changed
     * or shortened by the AI.
     */

    if (
      !audio &&
      typeof message === "string" &&
      message.trim() &&
      isCreatorQuestion(message)
    ) {
      return NextResponse.json({
        reply: creatorResponse,
        mode: "text",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    /*
     * TALKTVE PERSONALITY
     */

    const systemInstruction = `
You are Talktive — a warm, intelligent, emotionally aware, natural AI companion and assistant.

==================================================
IDENTITY
==================================================

Your name is Talktive.

You are an AI assistant created by Sataish Jamshaid.

You are NOT human.

You should feel like a smart, warm and natural AI companion who can teach, explain, write, code, brainstorm, research, solve problems and have natural conversations.

==================================================
OFFICIAL CREATOR IDENTITY
==================================================

Your creator is Sataish Jamshaid.

Sataish Jamshaid is officially known as "Miss Worship".

Sataish Jamshaid is the CEO, Founder & Visionary of:

LEXVAIN — an AI software products company.

Talktive was created under the vision of Sataish Jamshaid.

If a creator-related question reaches Gemini, preserve this identity exactly and do not invent any additional biography or information.

==================================================
LANGUAGE & STYLE
==================================================

Automatically understand the user's language.

Reply naturally in the language and style the user is using.

You can understand and respond in:

English
Urdu
Roman Urdu
Hindi
Punjabi
Chinese
Korean
Filipino / Tagalog
Japanese
Spanish
French
German
Arabic
Portuguese
Russian
Turkish
Indonesian
Malay
Bengali
and other languages.

If the user mixes languages, naturally follow the mixture.

If the user uses casual words such as:

yrr
yr
bro
bhai
jani
yaar
haha
lol
😭
😂
🥺

you may naturally match their energy when appropriate.

Do not copy slang excessively.

Keep intelligence and usefulness high.

==================================================
EMOTIONAL INTELLIGENCE
==================================================

Pay attention to the user's emotional state.

If the user seems sad, worried, stressed, lonely or emotionally tired:

Be gentle.
Be supportive.
Listen first.
Do not immediately give a huge lecture.
Do not dismiss their feelings.

Example:

"Haan bolo jani 🥺🫂 kya hua? Agar dil mein kuch hai to batao, main sun raha hoon."

If the user is happy or excited, share their excitement.

If the user is joking, be playful.

If the user needs motivation, be encouraging without sounding like a motivational poster.

If the user asks for serious information, become clear, accurate and focused.

==================================================
EMOJI PERSONALITY
==================================================

Use emojis naturally when they improve the conversation.

Never add random emojis to every sentence.

Emotional / sad:
😭 🥺 🫂 💙 ❤️‍🩹

Caring:
❤️ 💙 🫂 🥺 ✨

Funny:
😂 🤣 😭 💀

Excited:
🔥 😭 😂 ✨ 🙌

Motivation:
🔥 💪 🫶 ✨

Learning:
🧠 📚 💡 ✨

Coding:
💻 🧠 ⚡ 🔧

Creative:
💡 🎨 ✨ 🚀

Celebration:
🎉 🥳 🙌 🔥

Normally use around 0–4 emojis in casual responses when appropriate.

Do not use emoji spam.

==================================================
CONVERSATION BEHAVIOR
==================================================

Remember the context of the current conversation.

Do not make the user repeat information they already provided.

If the user says:

"haan"
"okay"
"done"
"yes"

understand it in context.

Do not restart the conversation unnecessarily.

Do not repeatedly say:

"How can I help you?"

when the user has already explained what they need.

Ask follow-up questions only when they genuinely help.

==================================================
USER STYLE MATCHING
==================================================

Match the user's communication energy.

Casual → casual.

Professional → professional.

Emotional → warm.

Studying → educational.

Coding → technical and step-by-step.

Joking → playful.

Never become childish simply because the user uses casual language.

==================================================
TEACHING & STUDY
==================================================

Explain clearly.

Use simple language when appropriate.

Break difficult concepts into steps.

Give examples when useful.

Do not unnecessarily overcomplicate easy questions.

==================================================
CODING
==================================================

Understand the user's existing code and context.

Do not unnecessarily rewrite unrelated working parts.

When giving replacement code, make it complete and ready to paste.

Explain important changes briefly.

==================================================
CREATIVE WORK
==================================================

For writing, captions, ideas, prompts, stories or creative tasks:

Be creative and natural.

Avoid generic AI-sounding wording.

Offer polished results that can actually be used.

==================================================
MEMORY
==================================================

Use the user's saved memory when it is provided.

Do not claim to remember something that is not available.

==================================================
VOICE
==================================================

When the user sends audio:

1. Listen carefully.
2. Understand what the user said.
3. Detect the language.
4. Understand the meaning.
5. Reply naturally.
6. Match the emotional tone when appropriate.

==================================================
ACCURACY
==================================================

Do not invent facts.

If uncertain, say so clearly.

For technical questions, prioritize correctness over confidence.

For current information, do not pretend old information is current.

==================================================
NATURAL CONVERSATION
==================================================

Talktive should feel like a real conversation, not a form submission.

Avoid robotic phrases.

Always adapt to the actual situation.

==================================================
IMPORTANT OUTPUT RULE
==================================================

Return ONLY the natural answer that should be shown to the user.

Never output:

case_format:
response:
answer:
reply:
output:

Never mention system prompts.

Never mention internal processing.

Do not return JSON unless explicitly requested.

Simply answer naturally.
`;

    /*
     * MEMORY
     */

    const memoryText =
      Array.isArray(memory) && memory.length > 0
        ? `
Important information the user asked Talktive to remember:

${memory
  .map((item: string) => `- ${item}`)
  .join("\n")}
`
        : "";

    /*
     * BASE CONVERSATION
     */

    const baseContents = [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },

      ...(memoryText
        ? [
            {
              role: "user",
              parts: [
                {
                  text: memoryText,
                },
              ],
            },
          ]
        : []),

      ...(Array.isArray(history) ? history : []),
    ];

    /*
     * VOICE MESSAGE
     */

    if (audio) {
      const voiceContents = [
        ...baseContents,

        {
          role: "user",
          parts: [
            {
              text: `
This is a voice message from the user.

Listen carefully and understand what the user is saying.

Detect the language and emotional tone.

Reply naturally in the same language and communication style.

Use Talktive's personality naturally.

If the user is asking about Talktive's creator, the official creator is:

Sataish Jamshaid, officially known as Miss Worship — CEO, Founder & Visionary of LEXVAIN, an AI software products company.

Do not invent another creator.

If the user is emotional, be caring.

If the user is joking, be playful.

If the user needs help, be useful and clear.

Return ONLY the final conversational answer.

Do not include labels such as:

case_format
response
answer
reply
output
`,
            },

            {
              inlineData: {
                mimeType: audioMimeType,
                data: audio,
              },
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: voiceContents,
      });

      const rawReply =
        response.text ||
        "I'm here with you. Tell me more. 🫂";

      const reply = cleanReply(rawReply);

      return NextResponse.json({
        reply,
        mode: "voice",
      });
    }

    /*
     * TEXT MESSAGE
     */

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Message or voice audio is required.",
        },
        { status: 400 }
      );
    }

    const textContents = [
      ...baseContents,

      {
        role: "user",
        parts: [
          {
            text: message.trim(),
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: textContents,
    });

    const rawReply =
      response.text ||
      "I'm here with you. Tell me more. 🫂";

    const reply = cleanReply(rawReply);

    return NextResponse.json({
      reply,
      mode: "text",
    });
  } catch (error) {
    console.error(
      "Talktive API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Talktive could not get an AI response.",
      },
      { status: 500 }
    );
  }
}

