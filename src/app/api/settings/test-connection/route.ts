import { NextResponse } from "next/server";
import { getDefaultUser } from "@/lib/get-user";
import { decrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const user = await getDefaultUser();
    const settings = user.settings;
    if (!settings) {
      return NextResponse.json({ error: "Settings not configured" }, { status: 400 });
    }

    const { service } = await request.json();
    const results: Record<string, { ok: boolean; message: string }> = {};

    if (service === "ai" || service === "all") {
      try {
        if (settings.aiProvider === "openai" && settings.openaiApiKey) {
          const key = decrypt(settings.openaiApiKey);
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${key}` },
          });
          results.ai = res.ok
            ? { ok: true, message: "OpenAI connected" }
            : { ok: false, message: `OpenAI error: ${res.status}` };
        } else if (settings.aiProvider === "anthropic" && settings.anthropicApiKey) {
          const key = decrypt(settings.anthropicApiKey);
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: settings.aiModel,
              max_tokens: 10,
              messages: [{ role: "user", content: "Hi" }],
            }),
          });
          results.ai = res.ok
            ? { ok: true, message: "Anthropic connected" }
            : { ok: false, message: `Anthropic error: ${res.status}` };
        } else {
          results.ai = { ok: false, message: "No AI API key configured" };
        }
      } catch (e) {
        results.ai = { ok: false, message: String(e) };
      }
    }

    if (service === "elevenlabs" || service === "all") {
      try {
        if (settings.elevenlabsApiKey) {
          const key = decrypt(settings.elevenlabsApiKey);
          const res = await fetch("https://api.elevenlabs.io/v1/voices", {
            headers: { "xi-api-key": key },
          });
          results.elevenlabs = res.ok
            ? { ok: true, message: "ElevenLabs connected" }
            : { ok: false, message: `ElevenLabs error: ${res.status}` };
        } else {
          results.elevenlabs = { ok: false, message: "No ElevenLabs API key configured" };
        }
      } catch (e) {
        results.elevenlabs = { ok: false, message: String(e) };
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
