import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { world } = await req.json();

  const scripts: Record<string, string> = {
    fantasy: `You have been chosen... The darkness has waited centuries for a soul like yours. Ancient evils stir beneath forgotten stones. Heroes have come before you... none have returned. Your story... begins... now.`,
    scifi: `Signal detected... Consciousness acknowledged. The galaxy is vast... cold... and utterly indifferent to your survival. Empires have fallen waiting for someone like you. Your mission... begins... now.`,
    horror: `I have watched you... For longer than you know. The walls between worlds grow thin. Something ancient... has taken notice of your arrival. There is no turning back. Your descent... begins... now.`,
    samurai: `The ancestors are watching... Your blade carries the weight of a thousand fallen warriors. Honor is a burden few survive. The path of the sword is written in blood. Your legend... begins... now.`,
  };

  const text = scripts[world] || scripts.fantasy;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "No API key" }, { status: 400 });
  }

  try {
    // "Clyde" voice — deep, raspy, villain-like. Free on ElevenLabs.
    const voiceId = "2EiwWnXFnvU5JabPnv8n";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.75,
            style: 0.8,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.log("ElevenLabs error:", err.slice(0, 200));
      return Response.json({ error: "ElevenLabs failed" }, { status: 400 });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return Response.json({ audio: base64, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.log("Voice error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
