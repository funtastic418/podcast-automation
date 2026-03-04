interface TTSConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
}

interface TTSResult {
  audioBuffer: Buffer;
}

const MAX_CHARS_PER_REQUEST = 5000;

export async function generateAudio(
  text: string,
  config: TTSConfig
): Promise<TTSResult> {
  // Split text into chunks if it exceeds the limit
  const chunks = splitText(text, MAX_CHARS_PER_REQUEST);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const buffer = await generateChunk(chunk, config);
    audioBuffers.push(buffer);
  }

  // Concatenate all MP3 buffers (MP3 frames are independent)
  const audioBuffer = Buffer.concat(audioBuffers);
  return { audioBuffer };
}

async function generateChunk(
  text: string,
  config: TTSConfig
): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": config.apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: config.modelId,
        voice_settings: {
          stability: config.stability,
          similarity_boost: config.similarityBoost,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxLength && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

export async function listVoices(
  apiKey: string
): Promise<{ voice_id: string; name: string }[]> {
  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs voices API error: ${response.status}`);
  }

  const data = await response.json();
  return data.voices.map(
    (v: { voice_id: string; name: string }) => ({
      voice_id: v.voice_id,
      name: v.name,
    })
  );
}

export function estimateDuration(audioBuffer: Buffer): number {
  // MP3 at 128kbps: 1 second ≈ 16,000 bytes
  // This is a rough estimate; for exact duration, parse MP3 frames
  const bitrate = 128000; // bits per second
  const durationSeconds = (audioBuffer.length * 8) / bitrate;
  return Math.round(durationSeconds);
}
