import { NextRequest } from 'next/server';
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  const { imageBase64, storyContext } = await req.json();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a Dungeon Master in a dark fantasy world. A player has shown you an object through their camera.

Current story context: ${storyContext}

Look at this object and respond with ONLY a JSON object in this exact format:
{"objectName":"the fantasy name for this object","fantasyDescription":"1-2 sentences describing it as a mysterious magical item in dark fantasy style","storyIntegration":"1 sentence on how to weave this into the current story"}

Be creative — a pen becomes an 'Enchanted Scribe Quill', a phone becomes a 'Dark Mirror of Visions', a mouse becomes a 'Mechanical Familiar of the Tech Mages', a bottle becomes an 'Ancient Vial of Forgotten Elixirs'. Always make it sound magical and ominous. Respond with ONLY the JSON, nothing else.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                }
              }
            ]
          }
        ],
        max_tokens: 512,
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    console.log('Groq vision status:', response.status);

    if (data.error) {
      console.log('Groq vision error:', JSON.stringify(data.error));
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    const raw = data.choices?.[0]?.message?.content ?? '{}';
    console.log('Groq vision raw:', raw.slice(0, 200));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    return Response.json(parsed);

  } catch (err: any) {
    console.log('Object analysis error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}