import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDefaultUser } from "@/lib/get-user";
import { runPipeline } from "@/lib/pipeline";

export async function GET() {
  try {
    const user = await getDefaultUser();
    const episodes = await prisma.episode.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(episodes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getDefaultUser();
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Check settings are configured
    if (
      !user.settings?.openaiApiKey &&
      !user.settings?.anthropicApiKey
    ) {
      return NextResponse.json(
        { error: "Please configure your AI API key in Settings first" },
        { status: 400 }
      );
    }
    if (!user.settings?.elevenlabsApiKey) {
      return NextResponse.json(
        { error: "Please configure your ElevenLabs API key in Settings first" },
        { status: 400 }
      );
    }
    if (!user.settings?.elevenlabsVoiceId) {
      return NextResponse.json(
        { error: "Please select an ElevenLabs voice in Settings first" },
        { status: 400 }
      );
    }

    const episode = await prisma.episode.create({
      data: {
        userId: user.id,
        topic,
      },
    });

    // Fire and forget - pipeline runs in background
    runPipeline(episode.id).catch((err) => {
      console.error("Pipeline error for episode", episode.id, err);
    });

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
