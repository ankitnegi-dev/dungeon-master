import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, sceneImage, world, stats } = await req.json();

  const worldNames: Record<string, string> = {
    fantasy: 'A Dark Fantasy Chronicle',
    scifi: 'A Space Opera Log',
    horror: 'A Cosmic Horror Account',
    samurai: 'A Bushido Tale',
  };

  const title = worldNames[world] || 'An Adventure Chronicle';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return Response.json({ title, date, messages, sceneImage, stats });
}