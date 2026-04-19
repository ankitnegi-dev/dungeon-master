import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { world } = await req.json();

  const welcomeScripts: Record<string, string> = {
    fantasy: `You have been chosen. The darkness has waited centuries for a soul like yours. Ancient evils stir beneath forgotten stones. Heroes have come before you... none have returned. Your story... begins... now.`,
    scifi: `Signal detected. Consciousness acknowledged. The galaxy is vast, cold, and utterly indifferent to your survival. Empires have fallen waiting for someone like you. Your mission... begins... now.`,
    horror: `I have watched you. For longer than you know. The walls between worlds grow thin. Something ancient has taken notice of your arrival. There is no turning back. Your descent... begins... now.`,
    samurai: `The ancestors are watching. Your blade carries the weight of a thousand fallen warriors. Honor is a burden few survive. The path of the sword is written in blood. Your legend... begins... now.`,
  };

  return Response.json({
    text: welcomeScripts[world] || welcomeScripts.fantasy,
  });
}
