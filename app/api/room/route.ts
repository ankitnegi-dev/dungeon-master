import { NextRequest } from "next/server";

type Character = { name: string; characterClass: string };
type Message = { role: "player" | "dm"; text: string };
type Stats = { health: number; gold: number; location: string; inventory: string[] };
type Location = { name: string; x: number; y: number; current: boolean };
type Room = {
  hostCharacter: Character | null;
  guestCharacter: Character | null;
  world: string;
  messages: Message[];
  stats: Stats;
  sceneImage: string | null;
  visitedLocations: Location[];
};

// In-memory room store (resets on server restart — fine for hackathon)
const rooms: Record<string, Room> = {};

export async function POST(req: NextRequest) {
  const { action, roomCode, character, world } = await req.json();

  if (action === "create") {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[code] = {
      hostCharacter: character,
      guestCharacter: null,
      world,
      messages: [],
      stats: { health: 100, gold: 10, location: "Unknown", inventory: [] },
      sceneImage: null,
      visitedLocations: [],
    };
    return Response.json({ roomCode: code });
  }

  if (action === "join") {
    const room = rooms[roomCode];
    if (!room)
      return Response.json({ error: "Room not found" }, { status: 404 });
    if (room.guestCharacter)
      return Response.json({ error: "Room is full" }, { status: 400 });
    room.guestCharacter = character;
    return Response.json({ room });
  }

  if (action === "sync") {
    const room = rooms[roomCode];
    if (!room)
      return Response.json({ error: "Room not found" }, { status: 404 });
    if (req.method === "POST") {
      const { messages, stats, sceneImage, visitedLocations } = await req
        .json()
        .catch(() => ({}));
      if (messages) room.messages = messages;
      if (stats) room.stats = stats;
      if (sceneImage) room.sceneImage = sceneImage;
      if (visitedLocations) room.visitedLocations = visitedLocations;
    }
    return Response.json({ room });
  }

  if (action === "get") {
    const room = rooms[roomCode];
    if (!room)
      return Response.json({ error: "Room not found" }, { status: 404 });
    return Response.json({ room });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
