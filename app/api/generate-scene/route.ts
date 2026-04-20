import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { scenePrompt } = await req.json();

  const seed = Math.floor(Math.random() * 99999);
  const prompt = encodeURIComponent(
    `dark fantasy oil painting dramatic lighting cinematic: ${scenePrompt}`
  );

  const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=288&seed=${seed}&nologo=true&nofeed=true&model=flux`;

  return Response.json({ image: imageUrl, isUrl: true });
}
