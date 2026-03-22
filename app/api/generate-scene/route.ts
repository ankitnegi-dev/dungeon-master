import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { scenePrompt } = await req.json();

  try {
    const prompt = `dark fantasy digital painting, dramatic torchlight, cinematic, highly detailed: ${scenePrompt}`;

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      },
    );

    console.log("HuggingFace status:", response.status);
    if (!response.ok) {
      const errText = await response.text();
      console.log("HuggingFace error:", errText.slice(0, 200));
      throw new Error(`HuggingFace: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    console.log("Image size:", buffer.byteLength);
    if (buffer.byteLength < 1000) throw new Error("Too small");

    const base64 = Buffer.from(buffer).toString("base64");
    return Response.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (err: any) {
    console.log("Image error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
