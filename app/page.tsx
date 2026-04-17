"use client";
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

type Message = { role: "player" | "dm"; text: string };
type Stats = {
  health: number;
  gold: number;
  location: string;
  inventory: string[];
};

export default function DungeonMaster() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [world, setWorld] = useState<string>("");
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraCapturing, setCameraCapturing] = useState(false);
  const [savedSession, setSavedSession] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    health: 100,
    gold: 10,
    location: "Unknown",
    inventory: [],
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const listeningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const session = loadSession();
    if (session && session.messages?.length > 0) {
      setSavedSession(session);
    }
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --ink: #0a0805;
        --parchment: #1a1410;
        --parchment-mid: #221c15;
        --parchment-light: #2d2318;
        --gold: #c9943a;
        --gold-light: #e8b96a;
        --gold-dim: #7a5a22;
        --blood: #8b1a1a;
        --ember: #d4521a;
        --ash: #6b5d4f;
        --fog: #3d3228;
        --text-primary: #e8d5b0;
        --text-secondary: #a08060;
        --text-dim: #6b5040;
        --border: rgba(201,148,58,0.2);
        --border-bright: rgba(201,148,58,0.5);
        --glow: rgba(201,148,58,0.08);
      }
      body { background: var(--ink); }
      .grimoire-bg {
        background: var(--ink);
        background-image:
          radial-gradient(ellipse at 20% 50%, rgba(139,26,26,0.04) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(201,148,58,0.05) 0%, transparent 50%),
          radial-gradient(ellipse at 60% 80%, rgba(139,26,26,0.03) 0%, transparent 40%);
        min-height: 100vh;
      }
      .font-display { font-family: 'Cinzel Decorative', serif; }
      .font-heading { font-family: 'Cinzel', serif; }
      .font-body { font-family: 'EB Garamond', serif; }
      .candle-glow { box-shadow: 0 0 40px rgba(201,148,58,0.06), inset 0 1px 0 rgba(201,148,58,0.1); }
      .dm-bubble {
        background: linear-gradient(135deg, var(--parchment-mid) 0%, var(--parchment) 100%);
        border: 1px solid var(--border);
        border-left: 2px solid var(--gold-dim);
        box-shadow: 0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,148,58,0.05);
        font-family: 'EB Garamond', serif;
        font-size: 16px;
        line-height: 1.8;
        color: var(--text-primary);
      }
      .player-bubble {
        background: linear-gradient(135deg, #1a0f0a 0%, #150c08 100%);
        border: 1px solid rgba(139,26,26,0.4);
        border-right: 2px solid var(--blood);
        box-shadow: 0 2px 20px rgba(0,0,0,0.4);
        font-family: 'EB Garamond', serif;
        font-size: 15px;
        color: #d4a882;
        font-style: italic;
      }
      @keyframes flicker {
        0%, 100% { opacity: 1; }
        92% { opacity: 1; } 93% { opacity: 0.8; }
        94% { opacity: 1; } 96% { opacity: 0.9; } 97% { opacity: 1; }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulseGold {
        0%, 100% { box-shadow: 0 0 8px rgba(201,148,58,0.3); }
        50% { box-shadow: 0 0 20px rgba(201,148,58,0.6); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .msg-appear { animation: fadeSlideUp 0.4s ease forwards; }
      .orb-pulse { animation: pulseGold 2s ease-in-out infinite; }
      .title-shimmer {
        background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 40%, #fff5d6 50%, var(--gold-light) 60%, var(--gold) 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 4s linear infinite;
      }
      .health-bar {
        background: linear-gradient(90deg, var(--blood) 0%, var(--ember) 60%, #e8893a 100%);
        box-shadow: 0 0 8px rgba(139,26,26,0.6);
        transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
      }
      .scene-frame { position: relative; overflow: hidden; }
      .scene-frame::after {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(to bottom, transparent 60%, var(--parchment) 100%);
        pointer-events: none;
      }
      .inv-item {
        background: linear-gradient(90deg, var(--parchment-light), var(--parchment-mid));
        border: 1px solid var(--border);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .inv-item:hover { border-color: var(--border-bright); box-shadow: 0 0 12px rgba(201,148,58,0.1); }
      .act-btn {
        background: linear-gradient(135deg, #2a1a08 0%, #1a0f05 100%);
        border: 1px solid var(--gold-dim);
        color: var(--gold);
        font-family: 'Cinzel', serif;
        font-size: 13px;
        letter-spacing: 0.1em;
        transition: all 0.2s;
        cursor: pointer;
      }
      .act-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #3a2510 0%, #2a1808 100%);
        border-color: var(--gold);
        box-shadow: 0 0 20px rgba(201,148,58,0.2);
      }
      .act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .mic-btn {
        background: linear-gradient(135deg, #1a0808 0%, #0f0505 100%);
        border: 1px solid rgba(139,26,26,0.5);
        color: #8b3a3a;
        transition: all 0.2s;
        cursor: pointer;
      }
      .mic-btn:hover:not(:disabled) { border-color: var(--blood); box-shadow: 0 0 16px rgba(139,26,26,0.3); color: #c05050; }
      .mic-btn.listening {
        border-color: var(--blood);
        box-shadow: 0 0 20px rgba(139,26,26,0.5);
        animation: pulseGold 1s ease-in-out infinite;
        color: #e06060;
      }
      .cam-btn {
        background: linear-gradient(135deg, #0a1020 0%, #060810 100%);
        border: 1px solid rgba(58,100,201,0.4);
        color: #5a7acc;
        transition: all 0.2s;
        cursor: pointer;
      }
      .cam-btn:hover:not(:disabled) { border-color: #5a7acc; box-shadow: 0 0 16px rgba(58,100,201,0.2); color: #7a9aec; }
      .cam-btn.active { border-color: #5a7acc; box-shadow: 0 0 20px rgba(58,100,201,0.4); color: #aac0ff; }
      .input-field {
        background: rgba(10,8,5,0.8);
        border: 1px solid var(--border);
        color: var(--text-primary);
        font-family: 'EB Garamond', serif;
        font-size: 16px;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
      }
      .input-field:focus { border-color: var(--gold-dim); box-shadow: 0 0 16px rgba(201,148,58,0.08); }
      .input-field::placeholder { color: var(--text-dim); font-style: italic; }
      .stat-label {
        font-family: 'Cinzel', serif;
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--gold-dim);
      }
      .divider { border: none; height: 1px; background: linear-gradient(90deg, transparent, var(--border-bright), transparent); }
      .thinking-dots span {
        display: inline-block; width: 4px; height: 4px; border-radius: 50%;
        background: var(--gold-dim); margin: 0 2px;
        animation: fadeSlideUp 0.6s ease-in-out infinite alternate;
      }
      .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
      .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
      .scroll-area::-webkit-scrollbar { width: 4px; }
      .scroll-area::-webkit-scrollbar-track { background: transparent; }
      .scroll-area::-webkit-scrollbar-thumb { background: var(--fog); border-radius: 2px; }
      .landing-rune {
        font-size: 80px;
        filter: drop-shadow(0 0 30px rgba(201,148,58,0.4));
        animation: flicker 4s ease-in-out infinite;
      }
      .spinner { animation: spin 1s linear infinite; }
      .camera-corner-tl { position: absolute; top: 8px; left: 8px; width: 20px; height: 20px; border-top: 2px solid var(--gold); border-left: 2px solid var(--gold); }
      .camera-corner-tr { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-top: 2px solid var(--gold); border-right: 2px solid var(--gold); }
      .camera-corner-bl { position: absolute; bottom: 8px; left: 8px; width: 20px; height: 20px; border-bottom: 2px solid var(--gold); border-left: 2px solid var(--gold); }
      .camera-corner-br { position: absolute; bottom: 8px; right: 8px; width: 20px; height: 20px; border-bottom: 2px solid var(--gold); border-right: 2px solid var(--gold); }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const generateScene = async (prompt: string) => {
    if (!prompt) return;
    setImageLoading(true);
    setSceneImage(null);
    try {
      const res = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenePrompt: prompt }),
      });
      const data = await res.json();
      if (data.image) setSceneImage(data.image);
      else setImageLoading(false);
    } catch (e) {
      setImageLoading(false);
    }
  };

  const speakNarration = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 0.75;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(
      (v) =>
        v.name.includes("Male") ||
        v.name.includes("David") ||
        v.name.includes("Daniel"),
    );
    if (deepVoice) utterance.voice = deepVoice;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (listeningRef.current || loading) return;
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice not supported. Use Chrome!");
      return;
    }
    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    listeningRef.current = true;
    setIsListening(true);
    let submitted = false;
    recognition.start();
    recognition.onresult = (event: any) => {
      if (submitted) return;
      submitted = true;
      const transcript = event.results[0][0].transcript;
      recognition.abort();
      listeningRef.current = false;
      setIsListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = (e: any) => {
      console.log("Speech error:", e.error);
      listeningRef.current = false;
      setIsListening(false);
    };
    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
    };
    setTimeout(() => {
      if (listeningRef.current) {
        recognition.stop();
        listeningRef.current = false;
        setIsListening(false);
      }
    }, 8000);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
      });
      setCameraStream(stream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraOpen(false);
  };

  const captureObject = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCameraCapturing(true);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    closeCamera();
    const storyContext = messages
      .slice(-3)
      .map((m) => m.text)
      .join(" ");
    try {
      const res = await fetch("/api/analyze-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, storyContext }),
      });
      const data = await res.json();
      if (data.objectName) {
        const message = `[VISION] I reveal an object to the Dungeon Master. It is: "${data.objectName}" — ${data.fantasyDescription} ${data.storyIntegration} Weave this into our story now.`;
        sendMessage(message);
      }
    } catch (err) {
      console.log("Capture error:", err);
    }
    setCameraCapturing(false);
  };

  const exportStorybook = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;
    const contentW = pageW - margin * 2;

    const worldNames: Record<string, string> = {
      fantasy: "A Dark Fantasy Chronicle",
      scifi: "A Space Opera Log",
      horror: "A Cosmic Horror Account",
      samurai: "A Bushido Tale",
    };

    // ── Cover page ──
    doc.setFillColor(10, 8, 5);
    doc.rect(0, 0, pageW, pageH, "F");

    // Gold border
    doc.setDrawColor(201, 148, 58);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageW - 20, pageH - 20);
    doc.setLineWidth(0.2);
    doc.rect(13, 13, pageW - 26, pageH - 26);

    // Corner decorations
    const corners = [
      [14, 14],
      [196, 14],
      [14, 283],
      [196, 283],
    ];
    corners.forEach(([x, y]) => {
      doc.setFontSize(10);
      doc.setTextColor(201, 148, 58);
      doc.text("✦", x, y, { align: "center" });
    });

    // Title
    doc.setFontSize(28);
    doc.setTextColor(201, 148, 58);
    doc.setFont("times", "bold");
    doc.text("AI DUNGEON", pageW / 2, 100, { align: "center" });
    doc.text("MASTER", pageW / 2, 115, { align: "center" });

    doc.setLineWidth(0.3);
    doc.setDrawColor(201, 148, 58);
    doc.line(40, 122, 170, 122);

    doc.setFontSize(14);
    doc.setFont("times", "italic");
    doc.setTextColor(160, 128, 96);
    doc.text(worldNames[world] || "An Adventure Chronicle", pageW / 2, 135, {
      align: "center",
    });

    // Scene image on cover
    if (sceneImage) {
      try {
        doc.addImage(sceneImage, "JPEG", margin + 10, 150, contentW - 20, 80);
        doc.setDrawColor(201, 148, 58);
        doc.setLineWidth(0.3);
        doc.rect(margin + 10, 150, contentW - 20, 80);
      } catch (e) {}
    }

    // Stats summary on cover
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(107, 80, 64);
    doc.text(
      `Final Health: ${stats.health}/100  ·  Gold: ${stats.gold}  ·  Location: ${stats.location}`,
      pageW / 2,
      248,
      { align: "center" },
    );

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(9);
    doc.setTextColor(80, 60, 40);
    doc.text(`Chronicled on ${date}`, pageW / 2, 270, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(60, 45, 30);
    doc.text("Powered by Gemini AI · AI Dungeon Master", pageW / 2, 278, {
      align: "center",
    });

    // ── Story pages ──
    const dmMessages = messages.filter(
      (m: any) => m.role === "dm" && m.text && m.text.length > 10,
    );

    let currentY = margin + 10;
    let pageNum = 1;

    const addNewPage = () => {
      doc.addPage();
      pageNum++;
      doc.setFillColor(10, 8, 5);
      doc.rect(0, 0, pageW, pageH, "F");
      doc.setDrawColor(201, 148, 58);
      doc.setLineWidth(0.3);
      doc.rect(10, 10, pageW - 20, pageH - 20);
      doc.setFontSize(8);
      doc.setTextColor(107, 80, 64);
      doc.setFont("times", "italic");
      doc.text(`Page ${pageNum}`, pageW / 2, pageH - 12, { align: "center" });
      currentY = margin + 10;
    };

    // Chapter heading
    doc.addPage();
    pageNum++;
    doc.setFillColor(10, 8, 5);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setDrawColor(201, 148, 58);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageW - 20, pageH - 20);

    currentY = margin + 20;
    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.setTextColor(201, 148, 58);
    doc.text("THE CHRONICLE", pageW / 2, currentY, { align: "center" });
    currentY += 6;
    doc.setLineWidth(0.2);
    doc.line(margin + 20, currentY, pageW - margin - 20, currentY);
    currentY += 14;

    dmMessages.forEach((msg: any, idx: number) => {
      // Drop cap style chapter marker
      if (currentY > pageH - margin - 30) addNewPage();

      doc.setFontSize(9);
      doc.setFont("times", "bold");
      doc.setTextColor(201, 148, 58);
      doc.text(`· ${idx + 1} ·`, pageW / 2, currentY, { align: "center" });
      currentY += 7;

      // Narration text
      doc.setFontSize(11);
      doc.setFont("times", "italic");
      doc.setTextColor(232, 213, 176);

      const lines = doc.splitTextToSize(msg.text, contentW);
      lines.forEach((line: string) => {
        if (currentY > pageH - margin - 15) addNewPage();
        doc.text(line, margin, currentY);
        currentY += 6;
      });

      currentY += 6;

      // Ornamental divider
      if (idx < dmMessages.length - 1) {
        if (currentY > pageH - margin - 20) addNewPage();
        doc.setFontSize(10);
        doc.setTextColor(107, 80, 64);
        doc.text("· · · ✦ · · ·", pageW / 2, currentY, { align: "center" });
        currentY += 10;
      }
    });

    // ── Inventory page ──
    if (stats.inventory && stats.inventory.length > 0) {
      addNewPage();
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.setTextColor(201, 148, 58);
      doc.text("ITEMS COLLECTED", pageW / 2, currentY, { align: "center" });
      currentY += 10;
      doc.setLineWidth(0.2);
      doc.line(margin + 20, currentY, pageW - margin - 20, currentY);
      currentY += 12;

      stats.inventory.forEach((item: string) => {
        doc.setFontSize(11);
        doc.setFont("times", "italic");
        doc.setTextColor(232, 213, 176);
        doc.text(`◆  ${item}`, margin + 10, currentY);
        currentY += 8;
      });
    }

    // Save
    doc.save(`dungeon-master-chronicle-${Date.now()}.pdf`);
  };

  const saveSession = (
    msgs: Message[],
    currentStats: Stats,
    currentWorld: string,
    currentImage: string | null,
  ) => {
    try {
      const session = {
        messages: msgs,
        stats: currentStats,
        world: currentWorld,
        sceneImage: currentImage,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("dungeon-master-session", JSON.stringify(session));
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  const loadSession = () => {
    try {
      const raw = localStorage.getItem("dungeon-master-session");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const clearSession = () => {
    localStorage.removeItem("dungeon-master-session");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);
    const history = messages.slice(-12);
    setMessages((prev) => [...prev, { role: "player", text }]);
    const res = await fetch("/api/gemini-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history, world }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let dmText = "";
    setMessages((prev) => [...prev, { role: "dm", text: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace("data: ", ""));
          if (data.text) {
            dmText += data.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "dm", text: dmText };
              return updated;
            });
          }
          if (data.stats)
            setStats({
              health: data.stats.health ?? 100,
              gold: data.stats.gold ?? 10,
              location: data.stats.location ?? "Unknown",
              inventory: Array.isArray(data.stats.inventory)
                ? data.stats.inventory
                : [],
            });
          if (data.scenePrompt) generateScene(data.scenePrompt);
          if (data.done) {
            setLoading(false);
            if (dmText) speakNarration(dmText);
            setMessages((prev) => {
              saveSession(prev, stats, world, sceneImage);
              return prev;
            });
          }
          if (data.error) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "dm",
                text: "⚠ The veil tears... the vision fades. Try again.",
              };
              return updated;
            });
            setLoading(false);
          }
        } catch (e) {}
      }
    }
    setLoading(false);
  };

  const startAdventure = () => {
    setStarted(true);
    sendMessage("Begin the adventure.");
  };
  const healthColor =
    stats.health > 60 ? "#c84b2a" : stats.health > 30 ? "#d4521a" : "#8b1a1a";

  return (
    <div
      className="grimoire-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid rgba(201,148,58,0.15)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background:
              "linear-gradient(180deg, rgba(201,148,58,0.03) 0%, transparent 100%)",
          }}
        >
          <div
            className="orb-pulse"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #e8b96a, #c9943a)",
            }}
          />
          <h1
            className="font-display title-shimmer"
            style={{ fontSize: "18px", letterSpacing: "0.05em" }}
          >
            AI Dungeon Master
          </h1>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-dim)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.1em",
              }}
            >
              POWERED BY GEMINI
            </span>
            <div
              style={{
                width: "1px",
                height: "12px",
                background: "var(--border)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: "var(--gold-dim)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.08em",
              }}
            >
              {stats.location}
            </span>
          </div>
          {started && messages.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginLeft: "12px",
              }}
            >
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  fontFamily: "Cinzel, serif",
                  letterSpacing: "0.08em",
                }}
              >
                SAVED
              </span>
            </div>
          )}
          {started && (
            <button
              onClick={exportStorybook}
              className="act-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "11px",
                letterSpacing: "0.1em",
                marginLeft: "12px",
              }}
              title="Export your adventure as a PDF storybook"
            >
              📖 EXPORT
            </button>
          )}
          {started && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Start a new adventure? Your current session is saved.",
                  )
                ) {
                  setStarted(false);
                  setWorld("");
                  setMessages([]);
                  setSceneImage(null);
                  setStats({
                    health: 100,
                    gold: 10,
                    location: "Unknown",
                    inventory: [],
                  });
                }
              }}
              className="mic-btn"
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "11px",
                letterSpacing: "0.1em",
                border: "1px solid",
                fontFamily: "Cinzel, serif",
              }}
            >
              ↺ NEW
            </button>
          )}
        </header>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Chat */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              className="scroll-area"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {!started && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: "28px",
                    padding: "20px",
                  }}
                >
                  {!world ? (
                    <>
                      {savedSession && (
                        <div
                          style={{
                            background: "rgba(201,148,58,0.08)",
                            border: "1px solid rgba(201,148,58,0.3)",
                            borderRadius: "8px",
                            padding: "16px 20px",
                            maxWidth: "500px",
                            width: "100%",
                            marginBottom: "8px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "Cinzel, serif",
                              fontSize: "12px",
                              color: "var(--gold)",
                              letterSpacing: "0.1em",
                              marginBottom: "8px",
                            }}
                          >
                            ✦ ADVENTURE IN PROGRESS
                          </p>
                          <p
                            style={{
                              fontFamily: "EB Garamond, serif",
                              fontSize: "14px",
                              color: "var(--text-secondary)",
                              marginBottom: "4px",
                              fontStyle: "italic",
                            }}
                          >
                            {savedSession.world === "fantasy"
                              ? "⚔️ Dark Fantasy"
                              : savedSession.world === "scifi"
                                ? "🚀 Space Opera"
                                : savedSession.world === "horror"
                                  ? "🕯️ Cosmic Horror"
                                  : "🗡️ Feudal Japan"}
                            {" · "}
                            {savedSession.stats?.location}
                          </p>
                          <p
                            style={{
                              fontFamily: "EB Garamond, serif",
                              fontSize: "13px",
                              color: "var(--text-dim)",
                              marginBottom: "12px",
                            }}
                          >
                            {savedSession.messages?.length} exchanges · Saved{" "}
                            {new Date(savedSession.savedAt).toLocaleString()}
                          </p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                setMessages(savedSession.messages);
                                setStats(savedSession.stats);
                                setWorld(savedSession.world);
                                setSceneImage(savedSession.sceneImage);
                                setStarted(true);
                                setSavedSession(null);
                              }}
                              className="act-btn"
                              style={{
                                padding: "8px 20px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                letterSpacing: "0.1em",
                              }}
                            >
                              CONTINUE ADVENTURE
                            </button>
                            <button
                              onClick={() => {
                                clearSession();
                                setSavedSession(null);
                              }}
                              className="mic-btn"
                              style={{
                                padding: "8px 14px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                border: "1px solid",
                                fontFamily: "Cinzel, serif",
                              }}
                            >
                              NEW GAME
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="landing-rune">⚔</div>
                      <div style={{ textAlign: "center" }}>
                        <h2
                          className="font-display"
                          style={{ fontSize: "24px", marginBottom: "8px" }}
                        >
                          <span className="title-shimmer">
                            Choose Your Realm
                          </span>
                        </h2>
                        <p
                          className="font-body"
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "16px",
                          }}
                        >
                          Each world holds different dangers. Choose wisely.
                        </p>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px",
                          width: "100%",
                          maxWidth: "600px",
                        }}
                      >
                        {[
                          {
                            id: "fantasy",
                            icon: "⚔️",
                            name: "Dark Fantasy",
                            sub: "Swords, sorcery & ancient evil",
                            color: "#c9943a",
                            border: "rgba(201,148,58,0.4)",
                            bg: "rgba(201,148,58,0.05)",
                          },
                          {
                            id: "scifi",
                            icon: "🚀",
                            name: "Space Opera",
                            sub: "Neon cities & alien worlds",
                            color: "#5a9aec",
                            border: "rgba(90,154,236,0.4)",
                            bg: "rgba(90,154,236,0.05)",
                          },
                          {
                            id: "horror",
                            icon: "🕯️",
                            name: "Cosmic Horror",
                            sub: "Sanity frays, ancient things stir",
                            color: "#9a5aec",
                            border: "rgba(154,90,236,0.4)",
                            bg: "rgba(154,90,236,0.05)",
                          },
                          {
                            id: "samurai",
                            icon: "🗡️",
                            name: "Feudal Japan",
                            sub: "Honor, betrayal & bushido",
                            color: "#ec5a5a",
                            border: "rgba(236,90,90,0.4)",
                            bg: "rgba(236,90,90,0.05)",
                          },
                        ].map((w) => (
                          <button
                            key={w.id}
                            onClick={() => setWorld(w.id)}
                            style={{
                              background: w.bg,
                              border: `1px solid ${w.border}`,
                              borderRadius: "8px",
                              padding: "20px 16px",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = w.bg.replace("0.05", "0.12");
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = w.color;
                              (e.currentTarget as HTMLElement).style.boxShadow =
                                `0 0 24px ${w.border}`;
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = w.bg;
                              (
                                e.currentTarget as HTMLElement
                              ).style.borderColor = w.border;
                              (e.currentTarget as HTMLElement).style.boxShadow =
                                "none";
                            }}
                          >
                            <div
                              style={{ fontSize: "28px", marginBottom: "8px" }}
                            >
                              {w.icon}
                            </div>
                            <p
                              style={{
                                fontFamily: "Cinzel, serif",
                                fontSize: "13px",
                                color: w.color,
                                marginBottom: "4px",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {w.name}
                            </p>
                            <p
                              style={{
                                fontFamily: "EB Garamond, serif",
                                fontSize: "13px",
                                color: "var(--text-dim)",
                                fontStyle: "italic",
                              }}
                            >
                              {w.sub}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "60px" }}>
                        {world === "fantasy"
                          ? "⚔️"
                          : world === "scifi"
                            ? "🚀"
                            : world === "horror"
                              ? "🕯️"
                              : "🗡️"}
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <h2
                          className="font-display"
                          style={{ fontSize: "22px", marginBottom: "8px" }}
                        >
                          <span className="title-shimmer">
                            {world === "fantasy"
                              ? "Dark Fantasy"
                              : world === "scifi"
                                ? "Space Opera"
                                : world === "horror"
                                  ? "Cosmic Horror"
                                  : "Feudal Japan"}
                          </span>
                        </h2>
                        <p
                          className="font-body"
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "16px",
                            maxWidth: "340px",
                            lineHeight: "1.7",
                          }}
                        >
                          {world === "fantasy" &&
                            "A world of shadows and sorcery awaits. Ancient evil stirs in the darkness."}
                          {world === "scifi" &&
                            "The galaxy holds no mercy. Your story begins at the edge of known space."}
                          {world === "horror" &&
                            "Something watches from beyond the veil. Your sanity is your only shield."}
                          {world === "samurai" &&
                            "The way of the sword demands everything. Honor is your only currency."}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={startAdventure}
                          className="act-btn"
                          style={{
                            padding: "14px 40px",
                            borderRadius: "4px",
                            fontSize: "14px",
                            letterSpacing: "0.15em",
                          }}
                        >
                          ENTER THE REALM
                        </button>
                        <button
                          onClick={() => setWorld("")}
                          className="mic-btn"
                          style={{
                            padding: "14px 20px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            border: "1px solid",
                            fontFamily: "Cinzel, serif",
                            letterSpacing: "0.1em",
                          }}
                        >
                          BACK
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="msg-appear"
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent:
                      msg.role === "player" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "dm" && (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 40% 35%, #3a2810, #1a0f05)",
                        border: "1px solid var(--gold-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                        boxShadow: "0 0 12px rgba(201,148,58,0.2)",
                      }}
                    >
                      🎲
                    </div>
                  )}
                  <div
                    className={
                      msg.role === "dm" ? "dm-bubble" : "player-bubble"
                    }
                    style={{
                      maxWidth: "88%",
                      borderRadius:
                        msg.role === "dm"
                          ? "2px 12px 12px 12px"
                          : "12px 2px 12px 12px",
                      padding: "14px 18px",
                    }}
                  >
                    {msg.text ||
                      (loading && i === messages.length - 1 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            className="font-body"
                            style={{
                              color: "var(--text-dim)",
                              fontStyle: "italic",
                              fontSize: "15px",
                            }}
                          >
                            The spirits stir
                          </span>
                          <div className="thinking-dots">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      ) : null)}
                  </div>
                  {msg.role === "player" && (
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 40% 35%, #2a1010, #150808)",
                        border: "1px solid rgba(139,26,26,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      🧙
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {started && (
              <div
                style={{
                  borderTop: "1px solid rgba(201,148,58,0.1)",
                  padding: "14px 16px",
                  background:
                    "linear-gradient(0deg, rgba(201,148,58,0.02) 0%, transparent 100%)",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={startListening}
                    disabled={loading || isListening}
                    className={`mic-btn ${isListening ? "listening" : ""}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "16px",
                      border: "1px solid",
                    }}
                    title="Speak your action"
                  >
                    {isListening ? "🔴" : "🎤"}
                  </button>
                  <button
                    onClick={cameraOpen ? closeCamera : openCamera}
                    disabled={loading || cameraCapturing}
                    className={`cam-btn ${cameraOpen ? "active" : ""}`}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "6px",
                      fontSize: "16px",
                      border: "1px solid",
                      opacity: cameraCapturing ? 0.5 : 1,
                    }}
                    title="Show object to camera"
                  >
                    {cameraCapturing ? "⏳" : "📸"}
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                    placeholder={
                      isListening
                        ? "Listening to your command..."
                        : "What do you do, traveller?"
                    }
                    disabled={loading || isListening}
                    className="input-field"
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "6px",
                    }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim() || isListening}
                    className="act-btn"
                    style={{ padding: "10px 20px", borderRadius: "6px" }}
                  >
                    {loading ? "..." : "ACT"}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    marginTop: "8px",
                    textAlign: "center",
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.08em",
                  }}
                >
                  TYPE YOUR FATE · SPEAK IT · OR REVEAL AN OBJECT
                </p>
              </div>
            )}
          </div>

          {/* Right: Scene + Stats */}
          {started && (
            <div
              style={{
                width: "280px",
                borderLeft: "1px solid rgba(201,148,58,0.12)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, rgba(10,8,5,0.6) 0%, transparent 100%)",
              }}
            >
              <div
                className="scene-frame"
                style={{
                  height: "180px",
                  background: "var(--parchment)",
                  flexShrink: 0,
                }}
              >
                {imageLoading && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      gap: "8px",
                      zIndex: 1,
                    }}
                  >
                    <div
                      className="spinner"
                      style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid var(--gold-dim)",
                        borderTopColor: "var(--gold)",
                        borderRadius: "50%",
                      }}
                    />
                    <span
                      className="font-heading"
                      style={{
                        fontSize: "10px",
                        color: "var(--gold-dim)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      PAINTING SCENE
                    </span>
                  </div>
                )}
                {sceneImage ? (
                  <img
                    src={sceneImage}
                    alt="Scene"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: imageLoading ? "none" : "block",
                      filter: "sepia(20%) contrast(1.1)",
                    }}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                ) : !imageLoading ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-dim)",
                        fontFamily: "Cinzel, serif",
                        letterSpacing: "0.1em",
                      }}
                    >
                      AWAITING VISION
                    </span>
                  </div>
                ) : null}
              </div>

              <hr className="divider" />

              <div
                className="scroll-area"
                style={{ flex: 1, overflowY: "auto", padding: "16px" }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span className="stat-label">Vitality</span>
                    <span
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "12px",
                        color: healthColor,
                      }}
                    >
                      {stats.health} / 100
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="health-bar"
                      style={{
                        height: "100%",
                        width: `${stats.health}%`,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
                <hr className="divider" style={{ marginBottom: "16px" }} />
                <div style={{ marginBottom: "16px" }}>
                  <span className="stat-label">Coin</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "20px",
                        color: "var(--gold)",
                      }}
                    >
                      {stats.gold}
                    </span>
                    <span
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "11px",
                        color: "var(--gold-dim)",
                      }}
                    >
                      PIECES
                    </span>
                  </div>
                </div>
                <hr className="divider" style={{ marginBottom: "16px" }} />
                <div>
                  <span
                    className="stat-label"
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    Satchel
                  </span>
                  {(stats.inventory ?? []).length === 0 ? (
                    <p
                      style={{
                        fontFamily: "EB Garamond, serif",
                        fontSize: "14px",
                        color: "var(--text-dim)",
                        fontStyle: "italic",
                      }}
                    >
                      Nothing carried
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {stats.inventory.map((item, i) => (
                        <div
                          key={i}
                          className="inv-item"
                          style={{
                            padding: "7px 10px",
                            borderRadius: "3px",
                            fontFamily: "EB Garamond, serif",
                            fontSize: "14px",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--gold-dim)",
                              fontSize: "10px",
                            }}
                          >
                            ◆
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Camera overlay */}
      {cameraOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <p
            style={{
              fontFamily: "Cinzel Decorative, serif",
              fontSize: "16px",
              color: "var(--gold)",
              letterSpacing: "0.15em",
            }}
          >
            REVEAL YOUR OBJECT
          </p>
          <p
            style={{
              fontFamily: "EB Garamond, serif",
              fontSize: "15px",
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            Hold it before the arcane lens...
          </p>
          <div
            style={{
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid var(--gold-dim)",
              boxShadow: "0 0 60px rgba(201,148,58,0.15)",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "400px",
                height: "300px",
                objectFit: "cover",
                display: "block",
              }}
              autoPlay
              playsInline
              muted
            />
            <div
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              <div className="camera-corner-tl" />
              <div className="camera-corner-tr" />
              <div className="camera-corner-bl" />
              <div className="camera-corner-br" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={captureObject}
              className="act-btn"
              style={{
                padding: "12px 32px",
                borderRadius: "6px",
                fontSize: "13px",
                letterSpacing: "0.15em",
              }}
            >
              ✦ REVEAL TO THE DM
            </button>
            <button
              onClick={closeCamera}
              className="mic-btn"
              style={{
                padding: "12px 20px",
                borderRadius: "6px",
                fontSize: "13px",
                border: "1px solid",
              }}
            >
              CANCEL
            </button>
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.08em",
            }}
          >
            THE DM WILL WEAVE YOUR OBJECT INTO THE STORY
          </p>
        </div>
      )}
    </div>
  );
}
