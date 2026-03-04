import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt, decrypt, maskSecret } from "@/lib/encryption";
import { getDefaultUser } from "@/lib/get-user";

const ENCRYPTED_FIELDS = [
  "openaiApiKey",
  "anthropicApiKey",
  "elevenlabsApiKey",
];

export async function GET() {
  try {
    const user = await getDefaultUser();
    const settings = user.settings;
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    // Convert nulls to empty strings for the frontend, mask encrypted fields
    const masked = { ...settings } as Record<string, unknown>;
    for (const key of Object.keys(masked)) {
      if (masked[key] === null) masked[key] = "";
    }
    for (const field of ENCRYPTED_FIELDS) {
      const val = (settings as Record<string, unknown>)[field] as string | null;
      masked[field] = val ? maskSecret(decrypt(val)) : "";
      masked[`${field}_set`] = !!val;
    }

    return NextResponse.json(masked);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getDefaultUser();
    const body = await request.json();

    // Build the update data, encrypting sensitive fields
    const data: Record<string, unknown> = {};
    const allowedFields = [
      "aiProvider",
      "aiModel",
      "elevenlabsVoiceId",
      "elevenlabsModelId",
      "elevenlabsStability",
      "elevenlabsSimilarity",
      "podcastName",
      "podcastDescription",
      "podcastAuthor",
      "podcastCoverUrl",
      "podcastCategory",
      "podcastLanguage",
      "podcastExplicit",
      "defaultPromptTemplate",
      "targetScriptLength",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    // Handle encrypted fields - only update if a new value is provided (not masked)
    for (const field of ENCRYPTED_FIELDS) {
      if (body[field] && !body[field].startsWith("****")) {
        data[field] = encrypt(body[field]);
      }
    }

    const settings = await prisma.settings.update({
      where: { userId: user.id },
      data,
    });

    return NextResponse.json({ success: true, id: settings.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
