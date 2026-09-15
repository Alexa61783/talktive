
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Image prompt is required.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const interaction =
      await ai.interactions.create({
        model:
          "gemini-3.1-flash-image",

        input: prompt,

        response_format: {
          type: "image",
          mime_type: "image/png",
          aspect_ratio: "1:1",
          image_size: "1K",
        },
      });

    const image =
      interaction.output_image;

    if (!image?.data) {
      return NextResponse.json(
        {
          error:
            "Talktive could not generate an image.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${image.data}`,
      text:
        interaction.output_text ||
        "Your image is ready.",
    });
  } catch (error) {
    console.error(
      "Talktive Image API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Talktive could not generate the image.",
      },
      { status: 500 }
    );
  }
}


