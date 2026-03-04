import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { generateScript } from "@/lib/ai-client";
import { generateAudio, estimateDuration } from "@/lib/elevenlabs-client";
import { generateSlug } from "@/lib/slug";
import fs from "fs/promises";
import path from "path";

async function logStep(
  episodeId: string,
  step: string,
  status: string,
  opts?: { message?: string; durationMs?: number; metadata?: string }
) {
  await prisma.pipelineLog.create({
    data: {
      episodeId,
      step,
      status,
      message: opts?.message,
      durationMs: opts?.durationMs,
      metadata: opts?.metadata,
    },
  });
}

async function updateStatus(
  episodeId: string,
  status: string,
  extra?: Record<string, unknown>
) {
  await prisma.episode.update({
    where: { id: episodeId },
    data: { status, ...extra },
  });
}

export async function runPipeline(episodeId: string): Promise<void> {
  const episode = await prisma.episode.findUniqueOrThrow({
    where: { id: episodeId },
    include: { user: { include: { settings: true } } },
  });

  const settings = episode.user.settings;
  if (!settings) throw new Error("User settings not configured");

  const steps = [
    {
      name: "generate_script",
      status: "generating_script",
      fn: () => stepGenerateScript(episodeId, episode.topic, settings),
    },
    {
      name: "generate_audio",
      status: "generating_audio",
      fn: () => stepGenerateAudio(episodeId, settings),
    },
    {
      name: "upload_audio",
      status: "uploading_audio",
      fn: () => stepUploadAudio(episodeId),
    },
  ];

  // If retrying, skip completed steps
  const startFrom = episode.errorStep;
  let shouldRun = !startFrom;

  for (const step of steps) {
    if (startFrom === step.name) shouldRun = true;
    if (!shouldRun) continue;

    await updateStatus(episodeId, step.status);
    await logStep(episodeId, step.name, "started");

    const startTime = Date.now();
    try {
      await step.fn();
      const durationMs = Date.now() - startTime;
      await logStep(episodeId, step.name, "completed", { durationMs });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : "Unknown error";
      await logStep(episodeId, step.name, "failed", { durationMs, message });
      await updateStatus(episodeId, "failed", {
        errorMessage: message,
        errorStep: step.name,
      });
      return;
    }
  }

  await updateStatus(episodeId, "published", {
    publishedAt: new Date(),
    errorMessage: null,
    errorStep: null,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stepGenerateScript(episodeId: string, topic: string, settings: any) {
  const apiKey =
    settings.aiProvider === "openai"
      ? decrypt(settings.openaiApiKey)
      : decrypt(settings.anthropicApiKey);

  const result = await generateScript(topic, {
    provider: settings.aiProvider,
    apiKey,
    model: settings.aiModel,
    systemPrompt: settings.defaultPromptTemplate || undefined,
    targetLength: settings.targetScriptLength,
  });

  // Get next episode number
  const lastEpisode = await prisma.episode.findFirst({
    where: { userId: settings.userId, episodeNumber: { not: null } },
    orderBy: { episodeNumber: "desc" },
  });
  const episodeNumber = (lastEpisode?.episodeNumber || 0) + 1;
  const slug = generateSlug("ep", episodeNumber);

  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      title: result.title,
      summary: result.summary,
      script: result.script,
      episodeNumber,
      slug,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stepGenerateAudio(episodeId: string, settings: any) {
  const episode = await prisma.episode.findUniqueOrThrow({
    where: { id: episodeId },
  });

  if (!episode.script) throw new Error("No script to convert to audio");

  const apiKey = decrypt(settings.elevenlabsApiKey);
  const { audioBuffer } = await generateAudio(episode.script, {
    apiKey,
    voiceId: settings.elevenlabsVoiceId,
    modelId: settings.elevenlabsModelId,
    stability: settings.elevenlabsStability,
    similarityBoost: settings.elevenlabsSimilarity,
  });

  const duration = estimateDuration(audioBuffer);

  // Store audio buffer temporarily in episode metadata for upload step
  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      duration,
      audioFileSize: audioBuffer.length,
    },
  });

  // Store buffer in global cache for the upload step
  audioCache.set(episodeId, audioBuffer);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function stepUploadAudio(episodeId: string) {
  const episode = await prisma.episode.findUniqueOrThrow({
    where: { id: episodeId },
  });

  const audioBuffer = audioCache.get(episodeId);
  if (!audioBuffer) {
    throw new Error("Audio buffer not found. Please retry from audio generation step.");
  }

  const filename = `${episode.slug || episode.id}.mp3`;
  let audioUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Use Vercel Blob in production
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
    });
    audioUrl = blob.url;
  } else {
    // Local file storage for development
    const audioDir = path.join(process.cwd(), "public", "audio");
    await fs.mkdir(audioDir, { recursive: true });
    await fs.writeFile(path.join(audioDir, filename), audioBuffer);
    audioUrl = `/audio/${filename}`;
  }

  await prisma.episode.update({
    where: { id: episodeId },
    data: { audioUrl },
  });

  // Clean up cache
  audioCache.delete(episodeId);
}

// In-memory cache for audio buffers between pipeline steps
const audioCache = new Map<string, Buffer>();
