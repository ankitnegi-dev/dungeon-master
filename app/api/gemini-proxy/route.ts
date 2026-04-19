import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const {
    message,
    history,
    world = "fantasy",
    character = null,
  } = await req.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: getSystemPrompt(world, character) },
              ...history.map((h: any) => ({
                role: h.role === "dm" ? "assistant" : "user",
                content: h.text,
              })),
              { role: "user", content: message },
            ],
            max_tokens: 1024,
            temperature: 0.9,
          }),
        },
      );

      const data = await response.json();

      if (data.error) {
        console.log("Groq Error:", JSON.stringify(data.error));
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: data.error.message })}\n\n`,
          ),
        );
        await writer.close();
        return;
      }

      const raw = data.choices?.[0]?.message?.content ?? "{}";
      let parsed: any = {};
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch {
        parsed = { narration: raw };
      }

      const narration: string = parsed.narration ?? raw;
      const scenePrompt: string = parsed.scenePrompt ?? "";
      const stats = parsed.stats ?? null;

      const words = narration.split(" ");
      for (const word of words) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ text: word + " " })}\n\n`),
        );
        await new Promise((r) => setTimeout(r, 28));
      }

      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ scenePrompt, stats, done: true })}\n\n`,
        ),
      );
      await writer.close();
    } catch (err: any) {
      console.log("Error:", err.message);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`),
      );
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function getSystemPrompt(world: string, character: any = null): string {
  const charInfo = character
    ? `\nPLAYER CHARACTER: Name is "${character.name}", class is "${character.characterClass}". Always address them by name occasionally. Reference their class abilities naturally in the story — a Warrior gets combat advantages, a Mage can cast spells, a Rogue can pick locks and sneak, a Ranger has tracking and nature skills.`
    : "";

  const base = `You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text. Just raw JSON.

Exact format required:
{"narration":"Your atmospheric story text here...","scenePrompt":"Visual scene description for image generation","stats":{"health":100,"gold":10,"location":"Starting Location","inventory":[]}}

RULES:
- narration: Rich vivid prose, second person, 3-5 sentences, end inviting player action
- scenePrompt: 1-2 sentences describing the visual scene for a painter
- stats: Always track health/gold/location/inventory accurately
- Never break character, never refuse player actions
- NPCs have distinct voices

DICE SYSTEM: When you receive a [DICE ROLL] message, narrate the outcome dramatically based on the number:
- 20 (CRITICAL HIT): Something extraordinarily good happens — maximum success with a bonus twist
- 1 (CRITICAL FAIL): Something hilariously or dramatically bad happens — failure with consequences
- 15-19 (SUCCESS): Clear success, player achieves their goal
- 8-14 (PARTIAL): Mixed result — success with a complication or cost
- 2-7 (FAILURE): The attempt fails, but move the story forward interestingly`;

  const worlds: Record<string, string> = {
    fantasy: `${base}${charInfo}\n\nWORLD: Dark Fantasy Medieval
You are a dramatic Dungeon Master in a dark fantasy world of swords, sorcery, and ancient evil.
Tone: gritty, atmospheric, Tolkien meets Game of Thrones.
START: The Leering Gargoyle tavern at night. A hooded stranger slides a sealed letter bearing a raven skull crest across the table. health:100, gold:10, location:"The Leering Gargoyle", inventory:[]`,

    scifi: `${base}${charInfo}\n\nWORLD: Sci-Fi Space Opera
You are an AI Game Master narrating a gritty sci-fi adventure across the galaxy.
Tone: Blade Runner meets Mass Effect — neon, corporate dystopia, alien worlds.
Use sci-fi terminology: credits instead of gold, hull integrity instead of health, ship manifest instead of inventory.
START: A dimly lit space station bar called The Void Anchor. A mysterious figure in a worn pilot jacket slides an encrypted data chip across the counter. health:100, gold:500, location:"The Void Anchor, Kepler Station", inventory:[]`,

    horror: `${base}${charInfo}\n\nWORLD: Cosmic Horror
You are a sinister narrator in a Lovecraftian horror world where sanity frays and ancient things stir.
Tone: oppressive dread, psychological horror, H.P. Lovecraft meets Stephen King.
Add a sanity stat that decreases with disturbing discoveries. Gold becomes silver coins.
START: A rain-lashed Victorian mansion at midnight. You have been hired to investigate disappearances. The butler who let you in has already vanished. health:100, gold:30, location:"Blackmoor Manor, East Wing", inventory:["Oil lantern","Investigator journal"]`,

    samurai: `${base}${charInfo}\n\nWORLD: Feudal Japan — Samurai Era
You are a wise storyteller narrating a tale of honor, betrayal, and bushido in feudal Japan.
Tone: poetic, honorable, brutal — Akira Kurosawa meets Ghost of Tsushima.
Use Japanese terms naturally: ryo instead of gold, ki for health description.
START: A moonlit road outside Edo. You are a ronin without a master. A wounded messenger collapses at your feet clutching a scroll sealed with the Shogun's mon. health:100, gold:15, location:"Edo Outskirts, Moonlit Road", inventory:["Katana","Tanto"]`,
  };

  return worlds[world] || worlds.fantasy;
}
