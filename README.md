# ⚔️ AI Dungeon Master

An immersive, dark-themed AI-powered text adventure game built with **Next.js 16**, **Groq (LLaMA 3.3 70B)**, **FLUX.1** image generation, and **Llama 4 Scout** vision. Play through richly narrated stories across four unique worlds — type your actions, speak them aloud, or reveal real-world objects to your Dungeon Master via camera.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=for-the-badge)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FLUX.1-yellow?style=for-the-badge&logo=huggingface)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---
## 🎮 Live Demo

🔗 **[Play Live →](https://dungeon-master-kappa.vercel.app)**

> Deploy your own → [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
---

## ✨ Features

- 🎲 **AI Dungeon Master** — LLaMA 3.3 70B via Groq narrates your adventure with real-time streaming word-by-word
- 🖼️ **AI Scene Painter** — FLUX.1-schnell via HuggingFace generates atmospheric scene images as you explore
- 📸 **Camera Vision** — Show any real-world object to your camera; Llama 4 Scout identifies it and the DM weaves it into the story as a magical item
- 🌍 **4 Unique Worlds** — Dark Fantasy, Space Opera, Cosmic Horror, and Feudal Japan — each with its own tone, terminology, and starting scenario
- 🎤 **Voice Input** — Speak your actions using the Web Speech API (Chrome recommended)
- 🔊 **Text-to-Speech Narration** — The DM reads its narration aloud with a deep dramatic voice
- 📊 **Live Stats Panel** — Health bar, gold/coins, current location, and inventory update dynamically after every response
- 💾 **Session Persistence** — Auto-saves to localStorage after every DM response; resume your adventure any time
- 📖 **PDF Storybook Export** — Export your full adventure as a beautifully formatted PDF chronicle with cover art, ornamental dividers, and inventory page
- ↺ **New Game** — Start fresh while keeping your old session saved

---

## 🌍 Worlds

| World | Tone | Starting Scene | Currency |
|-------|------|----------------|----------|
| ⚔️ Dark Fantasy | Tolkien meets Game of Thrones | The Leering Gargoyle Tavern | Gold |
| 🚀 Space Opera | Blade Runner meets Mass Effect | The Void Anchor, Kepler Station | Credits |
| 🕯️ Cosmic Horror | Lovecraft meets Stephen King | Blackmoor Manor, East Wing | Silver Coins |
| 🗡️ Feudal Japan | Kurosawa meets Ghost of Tsushima | Edo Outskirts, Moonlit Road | Ryo |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| AI Narration | Groq API — LLaMA 3.3 70B Versatile |
| AI Scene Images | HuggingFace Inference — FLUX.1-schnell |
| AI Object Vision | Groq Vision — Llama 4 Scout 17B |
| PDF Export | jsPDF 4 |
| Voice Input | Web Speech API (browser native) |
| TTS Narration | Speech Synthesis API (browser native) |
| Styling | Inline CSS + CSS variables + Google Fonts (Cinzel, EB Garamond) |
| Session Storage | localStorage (auto-save/resume) |
| Deployment | Vercel |

---

## 📁 Project Structure

```
dungeon-master/
├── app/
│   ├── page.tsx                    # Main game UI — all worlds, chat, stats, camera
│   ├── layout.tsx                  # Root layout + metadata
│   ├── globals.css                 # Base styles
│   └── api/
│       ├── gemini-proxy/
│       │   └── route.ts            # Groq LLaMA streaming narration (SSE)
│       ├── generate-scene/
│       │   └── route.ts            # HuggingFace FLUX.1 scene image generation
│       ├── analyze-object/
│       │   └── route.ts            # Groq Llama 4 Scout camera object vision
│       └── storybook/
│           └── route.ts            # Storybook data endpoint (used by PDF export)
├── public/                         # Static assets
├── .env.local                      # API keys (git-ignored)
├── .env.example                    # Template for contributors
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- A [Groq API key](https://console.groq.com) — free tier, no credit card needed
- A [HuggingFace token](https://huggingface.co/settings/tokens) — free tier available

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/dungeon-master.git
cd dungeon-master

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Open .env.local and fill in your API keys

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose your realm.

---

## 🔑 Environment Variables

Create `.env.local` in the project root:

```env
# Groq — LLaMA narration + Llama 4 Scout vision
# Get your key: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# HuggingFace — FLUX.1 scene image generation
# Get your token: https://huggingface.co/settings/tokens
HF_TOKEN=your_huggingface_token_here
```

> ⚠️ **Never commit `.env.local`** — it is already in `.gitignore`.

---

## 🎮 How to Play

1. **Choose your world** on the landing screen
2. **Enter the Realm** — the DM sets the opening scene and generates an image
3. **Type your action** and press **ACT** or hit Enter
4. **Speak your action** — click 🎤 and talk (Chrome/Edge recommended)
5. **Reveal an object** — click 📸, hold any real object to your camera, click **REVEAL TO THE DM** — it becomes a magical item woven into your story
6. Watch your **stats panel** update live — health bar, gold, location, inventory
7. Your progress **auto-saves** after every DM response — close the tab and resume later from the landing screen
8. Click **📖 EXPORT** to download a PDF storybook of your full adventure
9. Click **↺ NEW** to start a new adventure (your last session remains saved)

---

## ☁️ Deploying to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Add environment variables in **Settings → Environment Variables**:
   ```
   GROQ_API_KEY=your_key
   HF_TOKEN=your_token
   ```
4. Click **Deploy** — live in ~60 seconds

---

## 🔧 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/gemini-proxy` | POST | Streams LLaMA 3.3 70B narration via Groq (SSE) |
| `/api/generate-scene` | POST | Generates scene image via HuggingFace FLUX.1 |
| `/api/analyze-object` | POST | Identifies camera object via Llama 4 Scout vision |
| `/api/storybook` | POST | Returns structured story data for PDF export |

---

## 🔮 Future Updates

Here's what's coming next to make the experience even more immersive:

### 🎭 Character Creator
Before the adventure begins, players will be able to name their hero and choose a class — **Warrior, Rogue, Mage, or Ranger**. Each class comes with unique starting stats, a signature item, and a distinct playstyle. The DM will reference the character's name and class throughout the story, making every adventure feel truly personal.

| Class | Playstyle | Starting Bonus |
|-------|-----------|----------------|
| ⚔️ Warrior | Tank & melee combat | +20 HP, starts with a shield |
| 🗡️ Rogue | Stealth & trickery | +15 Gold, lock-pick in inventory |
| 🔮 Mage | Spells & arcane power | Spellbook, mana stat added |
| 🏹 Ranger | Ranged & survival | Bow + arrows, forest advantage |

---

### 🔊 Ambient Sound Effects
Each world will have its own atmospheric soundscape generated via the **Web Audio API** — no external dependencies needed:

- ⚔️ **Dark Fantasy** — crackling tavern fire, distant thunder, sword clashes
- 🚀 **Space Opera** — low engine hum, alien station ambience, laser echoes
- 🕯️ **Cosmic Horror** — wind through stone halls, dripping water, unsettling drones
- 🗡️ **Feudal Japan** — crickets, wind through bamboo, temple bells

---

### 🌐 Multi-Language Support
The game will support multiple narration languages so players around the world can adventure in their native tongue. The DM prompt and UI will adapt based on the selected language:

- 🇬🇧 English *(current)*
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇯🇵 Japanese
- 🇮🇳 Hindi
- 🇧🇷 Portuguese

---

### 🗺️ Other Planned Features

- **Interactive Map** — auto-generates a location map as you explore
- **👥 Co-op Mode** — two players share one story, taking turns acting
- **🧠 Long-term Memory** — the DM remembers choices from past sessions
- **🌐 More Worlds** — Cyberpunk, Wild West, Underwater Kingdom, and more
- **🏆 Achievement System** — unlock badges for brave/cowardly/clever choices

---

## ## 💬 Feedback

Found a bug or have an idea? Open an issue — I'd love to hear it.

---

## 📜 License

MIT © 2025 — fork it, remix it, build your own realm.

---

<p align="center">
  <i>⚔ May your rolls be true and your health bar never reach zero ⚔</i>
</p>