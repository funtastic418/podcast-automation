import { NextResponse } from "next/server";
import { getDefaultUser } from "@/lib/get-user";
import { decrypt } from "@/lib/encryption";
import { listVoices } from "@/lib/elevenlabs-client";

export async function GET() {
  try {
    const user = await getDefaultUser();
    const settings = user.settings;

    if (!settings?.elevenlabsApiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 400 }
      );
    }

    const apiKey = decrypt(settings.elevenlabsApiKey);
    const voices = await listVoices(apiKey);

    return NextResponse.json(voices);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
