import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { scenePrompt } = await req.json();

  try {
    const seed = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent(
      `dark fantasy digital painting, dramatic torchlight, cinematic, highly detailed, no text: ${scenePrompt}`,
    );

    const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=288&seed=${seed}&nologo=true&nofeed=true&model=flux`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://pollinations.ai",
      },
    });
    clearTimeout(timeout);

    console.log(
      "Pollinations status:",
      response.status,
      response.headers.get("content-type"),
    );

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image"))
      throw new Error("Not an image response");

    const buffer = await response.arrayBuffer();
    console.log("Image size:", buffer.byteLength);

    if (buffer.byteLength < 5000) throw new Error("Image too small");

    const base64 = Buffer.from(buffer).toString("base64");
    return Response.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (err: any) {
    console.log("Image error:", err.message);
    // Return a themed placeholder so UI doesn't break
    return Response.json({
      image: `https://picsum.photos/seed/${Math.floor(Math.random() * 500)}/512/288`,
    });
  }
}
