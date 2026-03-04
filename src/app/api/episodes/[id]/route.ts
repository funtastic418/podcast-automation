import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runPipeline } from "@/lib/pipeline";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: params.id },
      include: { pipelineLogs: { orderBy: { createdAt: "asc" } } },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Retry a failed episode
  try {
    const episode = await prisma.episode.findUnique({
      where: { id: params.id },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    if (episode.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed episodes can be retried" },
        { status: 400 }
      );
    }

    // Fire and forget
    runPipeline(episode.id).catch((err) => {
      console.error("Pipeline retry error for episode", episode.id, err);
    });

    return NextResponse.json({ success: true, message: "Retrying from " + episode.errorStep });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
