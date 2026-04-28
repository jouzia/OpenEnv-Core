import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import {
  motion, useMotionValue, useSpring, AnimatePresence,
} from "framer-motion";
import {
  Code2, Brain, BookOpen, Zap, Clock, Star, AlertTriangle,
  CheckCircle2, TrendingUp, Send, RefreshCw, Eye, Coffee,
  Activity, Database, Network, Layers, ChevronRight,
  Cpu, Globe, BarChart3, Sparkles, Moon, Bell, X,
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ACCENT_A = "#7c5cfc";
const ACCENT_Z = "#00e5b0";
const ACCENT_WARN = "#f59e0b";

const SUBJECTS = [
  { id: "dsa", name: "Data Structures & Algo", icon: Layers,   color: ACCENT_A,  target: 90 },
  { id: "oop", name: "Object Oriented Prog.",  icon: Cpu,      color: "#f87171", target: 80 },
  { id: "db",  name: "Database Systems",       icon: Database, color: ACCENT_Z,  target: 85 },
  { id: "cn",  name: "Computer Networks",      icon: Globe,    color: "#38bdf8", target: 75 },
];

const ARMAN_MSGS = [
  "Yaar, paste your code — I'll shatter it into tasks for you!",
  "OOP pe thoda zyada dhyan do. Polymorphism still feels shaky.",
  "Beautiful recursion! Time complexity: O(log n). Bilkul perfect.",
  "Chalo shuru karte hain — binary search tree, ab seedha!",
];
const ZARA_MSGS = [
  "Your CGPA trajectory is looking strong! 8.5 is achievable!",
  "Data says: peak hours 9–11 AM. Schedule DSA there!",
  "OOP lag detected. If you finish it this week, CGPA hits 8.4!",
  "Running regression... You're top 15% of your batch. Mashallah!",
];
const NOTIF_POOL = [
  { text: "DSA quiz in 2 days!",             icon: AlertTriangle, color: ACCENT_WARN, type: "warn"   },
  { text: "OOP lagging — Arman wants to help!", icon: Brain,       color: "#f87171",  type: "danger" },
  { text: "DB assignment submitted!",         icon: CheckCircle2,  color: ACCENT_Z,   type: "ok"     },
  { text: "CGPA updated — on track for 8.5", icon: TrendingUp,    color: ACCENT_A,   type: "info"   },
  { text: "Focus Guard: 10 min remaining!",  icon: Clock,         color: ACCENT_WARN, type: "warn"   },
  { text: "New study streak: 5 days!",       icon: Star,          color: "#f59e0b",  type: "ok"     },
];

// SentientGrid theme system
const THEMES = {
  happy:       { color: "#facc15", glow: "rgba(250,204,21,0.35)",  aura1: "#d97706", aura2: "#f59e0b", border: "rgba(250,204,21,0.25)", quote: "WE ARE SLAYING TODAY! ✨",          mood: 92, label: "Happy",     emoji: "😊", xpLabel: "+50 XP — VIBE CHECK",      bg: "from-yellow-500/20", streak: true  },
  angry:       { color: "#ef4444", glow: "rgba(239,68,68,0.35)",   aura1: "#b91c1c", aura2: "#dc2626", border: "rgba(239,68,68,0.25)",  quote: "LESS SCROLLING, MORE CODING. 💢",  mood: 35, label: "Focused",   emoji: "😤", xpLabel: "+50 XP — GRIND MODE",      bg: "from-red-600/20",    streak: false },
  mischievous: { color: "#a855f7", glow: "rgba(168,85,247,0.35)",  aura1: "#7c3aed", aura2: "#9333ea", border: "rgba(168,85,247,0.25)", quote: "I JUST HID YOUR GITHUB REPO... 😈", mood: 77, label: "Mischief",  emoji: "😈", xpLabel: "+50 XP — CHAOS UNLOCKED", bg: "from-purple-500/20", streak: false },
  sad:         { color: "#60a5fa", glow: "rgba(96,165,250,0.35)",  aura1: "#1d4ed8", aura2: "#3b82f6", border: "rgba(96,165,250,0.25)", quote: "I MISS OUR STREAK... 🌧️",          mood: 18, label: "Melancholy", emoji: "🌧️", xpLabel: "+50 XP — FEEL IT ALL",     bg: "from-blue-500/20",   streak: false },
};
const NAV_ITEMS = [
  { icon: "⚡", label: "Forge",   desc: "Build & Deploy" },
  { icon: "🗄️", label: "Vault",   desc: "Your Assets"   },
  { icon: "📡", label: "Stream",  desc: "Live Feed"      },
  { icon: "⚙️", label: "Control", desc: "Settings"       },
];

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #05070f; --glass: rgba(255,255,255,0.055); --glass2: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.08); --text: #e4e4ff; --muted: rgba(228,228,255,0.4);
    --font-d: 'Syne', sans-serif; --font-b: 'DM Sans', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-b); overflow: hidden; height: 100vh; width: 100vw; cursor: none; }

  .cursor { position: fixed; pointer-events: none; z-index: 99999; mix-blend-mode: screen; }
  .cursor-ring { width: 36px; height: 36px; border: 1.5px solid rgba(124,92,252,0.7); border-radius: 50%; transform: translate(-50%, -50%); transition: width 0.2s, height 0.2s; }
  .cursor-dot  { width: 6px;  height: 6px;  background: ${ACCENT_A}; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 10px ${ACCENT_A}; }

  #starfield { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

  .glass {
    background: var(--glass); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
    border-radius: 20px; border: 1px solid var(--border); position: absolute;
    cursor: grab; user-select: none; will-change: transform; overflow: hidden;
  }
  .glass:active { cursor: grabbing; }
  .glass::before {
    content: ''; position: absolute; inset: 0; border-radius: 20px;
    background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%); pointer-events: none;
  }

  .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 10px; border-bottom: 1px solid var(--border); }
  .panel-title { font-family: var(--font-d); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 8px; }

  .neu-btn { border: none; border-radius: 10px; font-family: var(--font-b); font-weight: 600; cursor: pointer; transition: all 0.25s ease; display: inline-flex; align-items: center; gap: 6px; }

  .slider-wrap { display: flex; flex-direction: column; gap: 8px; }
  .slider-row { display: flex; align-items: center; gap: 10px; }
  .slider-label { font-size: 11px; color: var(--muted); width: 140px; flex-shrink: 0; display: flex; align-items: center; gap: 5px; }
  .slider-pct { font-family: var(--font-d); font-size: 13px; font-weight: 700; width: 36px; text-align: right; }

  input[type=range] { -webkit-appearance: none; flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${ACCENT_A}; box-shadow: 0 0 12px ${ACCENT_A}; border: 2px solid rgba(255,255,255,0.3); cursor: grab; transition: transform 0.2s; }
  input[type=range]::-webkit-slider-thumb:active { transform: scale(1.3); cursor: grabbing; }

  .task-bubble { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 500; margin: 4px; background: rgba(124,92,252,0.2); border: 1px solid rgba(124,92,252,0.3); color: #c4b5fd; cursor: pointer; }

  .chat-bubble { max-width: 80%; padding: 9px 13px; border-radius: 14px; font-size: 12px; line-height: 1.6; margin-bottom: 8px; }
  .chat-bubble.ai       { background: rgba(124,92,252,0.15); border: 1px solid rgba(124,92,252,0.25); border-radius: 14px 14px 14px 4px; align-self: flex-start; }
  .chat-bubble.ai.zara-style { background: rgba(0,229,176,0.1); border-color: rgba(0,229,176,0.2); }
  .chat-bubble.user     { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px 14px 4px 14px; align-self: flex-end; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(124,92,252,0.3); border-radius: 2px; }

  .break-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; }
  .break-card { background: rgba(15,10,35,0.95); border: 1px solid rgba(124,92,252,0.3); border-radius: 28px; padding: 52px 60px; text-align: center; max-width: 480px; box-shadow: 0 0 100px rgba(124,92,252,0.15), 0 50px 100px rgba(0,0,0,0.5); }

  .topbar { position: fixed; top: 0; left: 0; right: 0; height: 52px; background: rgba(5,7,15,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 200; }

  @keyframes float-y { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  @keyframes orbit { from { transform: rotate(0deg) translateX(120px) rotate(0deg); } to { transform: rotate(360deg) translateX(120px) rotate(-360deg); } }
  @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function computeCGPA(subjects) {
  const total = subjects.reduce((s, sub) => s + sub.progress, 0);
  return Math.min(10, 7.5 + ((total / subjects.length) / 100) * 1.2).toFixed(1);
}
function shatterCode(code) {
  return code.split("\n").filter(Boolean).slice(0, 8).map((line, i) => ({
    id: i, text: line.trim().slice(0, 36) + (line.trim().length > 36 ? "…" : ""), done: false,
  }));
}

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2, a: Math.random(), da: (Math.random() - 0.5) * 0.006,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.a = Math.max(0.05, Math.min(1, s.a + s.da));
        if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,255,${s.a * 0.7})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} id="starfield" />;
}

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) { dotRef.current.style.left = e.clientX + "px"; dotRef.current.style.top = e.clientY + "px"; }
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    function loop() {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) { ringRef.current.style.left = ring.current.x + "px"; ringRef.current.style.top = ring.current.y + "px"; }
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={ringRef} className="cursor" style={{ position: "fixed" }}><div className="cursor-ring" /></div>
      <div ref={dotRef} className="cursor"><div className="cursor-dot" /></div>
    </>
  );
}

// ─── FLOATING PANEL ───────────────────────────────────────────────────────────
function FloatingPanel({ defaultX, defaultY, width, height, children, glowColor = ACCENT_A, zBase = 10 }) {
  const x = useMotionValue(defaultX);
  const y = useMotionValue(defaultY);
  const floatY = useSpring(0, { stiffness: 40, damping: 12 });
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(zBase);
  useEffect(() => {
    if (isDragging) return;
    const seed = defaultX * 0.01;
    let t = seed, raf;
    function tick() { t += 0.012; floatY.set(Math.sin(t) * 7); raf = requestAnimationFrame(tick); }
    tick();
    return () => cancelAnimationFrame(raf);
  }, [isDragging]);
  return (
    <motion.div
      className="glass"
      style={{ x, y, translateY: floatY, width, height, zIndex, boxShadow: `0 12px 60px rgba(0,0,0,0.5), 0 0 40px ${glowColor}22` }}
      drag dragMomentum={false} dragElastic={0.08}
      whileDrag={{ scale: 1.02, zIndex: 500 }}
      onDragStart={() => { setIsDragging(true); setZIndex(400); }}
      onDragEnd={() => { setIsDragging(false); setZIndex(zBase); }}
      whileHover={{ boxShadow: `0 16px 80px rgba(0,0,0,0.6), 0 0 60px ${glowColor}33` }}
    >
      {children}
    </motion.div>
  );
}

// ─── GRID BACKGROUND ─────────────────────────────────────────────────────────
function GridBG() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(255,255,255,0.018)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ─── XP TOAST ─────────────────────────────────────────────────────────────────
function XPToast({ msg, color, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ y: -30, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -30, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{
        position: "fixed", top: 62, left: "50%", transform: "translateX(-50%)",
        background: "rgba(10,10,15,0.95)", border: `1px solid ${color}44`,
        borderRadius: 999, padding: "10px 24px", fontSize: 10, fontWeight: 800,
        letterSpacing: "0.18em", textTransform: "uppercase", color, zIndex: 9999,
        whiteSpace: "nowrap", boxShadow: `0 4px 30px ${color}22`, backdropFilter: "blur(20px)",
      }}
    >
      {msg}
    </motion.div>
  );
}

// ─── CAT SVG (SentientGrid Bud) ───────────────────────────────────────────────
function CatSVG({ emotion, color, mouseX = 0, mouseY = 0 }) {
  const isSad = emotion === "sad";
  const isAngry = emotion === "angry";
  const isMischievous = emotion === "mischievous";
  const earL = isSad ? "M 22 43 L 28 56 L 36 50" : isAngry ? "M 19 33 L 27 48 L 36 43" : "M 22 37 L 28 51 L 36 45";
  const earR = isSad ? "M 78 43 L 72 56 L 64 50" : isAngry ? "M 81 33 L 73 48 L 64 43" : "M 78 37 L 72 51 L 64 45";
  const mouth = isSad ? "M 43 66 Q 50 62 57 66" : isAngry ? "M 43 65 Q 50 61 57 65" : isMischievous ? "M 43 63 Q 47 69 52 65 Q 56 61 57 65" : "M 43 63 Q 50 68 57 63";
  const eyeR = isAngry ? 1.8 : isMischievous ? 4.2 : 3.5;
  const pupilR = isAngry ? 1.2 : isMischievous ? 2.2 : 1.5;

  const ex = mouseX * 4;
  const ey = mouseY * 4;

  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ color, width: "100%", height: "100%", filter: `drop-shadow(0 0 20px ${color}66)` }}>
      <motion.circle cx="50" cy="55" r="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2"
        animate={{ r: [34, 38, 34], opacity: [0.15, 0.28, 0.15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      <motion.path d={earL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={{ d: earL }} transition={{ duration: 0.6 }} />
      <motion.path d={earR} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" animate={{ d: earR }} transition={{ duration: 0.6 }} />
      <circle cx="50" cy="56" r="27" stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,0.04)" />
      
      <motion.g animate={{ x: ex, y: ey }} transition={{ type: "spring", stiffness: 150, damping: 20 }}>
        <motion.circle cx="40" cy="51" stroke="currentColor" strokeWidth="1.8" fill="none" animate={{ r: eyeR }} transition={{ duration: 0.4 }} />
        <motion.circle cx="40" cy="51" fill="currentColor" opacity="0.85" animate={{ r: pupilR }} transition={{ duration: 0.4 }} />
        <motion.circle cx="60" cy="51" stroke="currentColor" strokeWidth="1.8" fill="none" animate={{ r: eyeR }} transition={{ duration: 0.4 }} />
        <motion.circle cx="60" cy="51" fill="currentColor" opacity="0.85" animate={{ r: pupilR }} transition={{ duration: 0.4 }} />
        <path d="M 48.5 57 L 50 59.5 L 51.5 57 Z" fill="currentColor" opacity="0.7" />
        <motion.path d={mouth} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" animate={{ d: mouth }} transition={{ duration: 0.5 }} />
      </motion.g>
      <line x1="18" y1="55" x2="36" y2="55" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
      <line x1="18" y1="60" x2="36" y2="59" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
      <line x1="82" y1="55" x2="64" y2="55" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
      <line x1="82" y1="60" x2="64" y2="59" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
      {emotion === "happy" && (<><circle cx="32" cy="62" r="5" fill="currentColor" opacity="0.12" /><circle cx="68" cy="62" r="5" fill="currentColor" opacity="0.12" /></>)}
    </svg>
  );
}

// ─── 3D GLB MODEL (white material) ───────────────────────────────────────────
function MascotModel3D({ path, mouseX, mouseY, scale = 1.8 }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef();
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.12, roughness: 0.3, metalness: 0.05 });
        child.castShadow = true;
      }
    });
    return c;
  }, [scene]);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX * 0.6, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY * 0.3, 0.08);
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.06;
  });
  return <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -1.2, 0]}><primitive object={cloned} /></group>;
}

function FallbackSphere() {
  const meshRef = useRef();
  useFrame((state) => { if (meshRef.current) meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5; });
  return <mesh ref={meshRef}><sphereGeometry args={[0.8, 32, 32]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} wireframe /></mesh>;
}

// ─── 3D STAGE CANVAS ─────────────────────────────────────────────────────────
function MascotStage3D({ activeMascot, mouseX, mouseY, accentColor }) {
  const modelPath = activeMascot === "arman" ? "/arman.glb" : "/zara.glb";
  return (
    <Canvas shadows camera={{ position: [0, 0.5, 4.5], fov: 42 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent", width: "100%", height: "100%" }}>
      <ambientLight intensity={0.4} />
      <spotLight position={[3, 6, 3]} angle={0.35} penumbra={0.8} intensity={1.8} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color={accentColor} />
      <Suspense fallback={<FallbackSphere />}>
        <Float speed={1.4} rotationIntensity={0.1} floatIntensity={0.2}>
          <MascotModel3D path={modelPath} mouseX={mouseX} mouseY={mouseY} />
        </Float>
        <ContactShadows position={[0, -1.8, 0]} opacity={0.35} scale={4} blur={2.5} far={3} />
      </Suspense>
      <Environment preset="studio" />
    </Canvas>
  );
}

// ─── NEXUS PANEL (mascot avatar + speech) ────────────────────────────────────
function NexusPanel({ activeMascot, onToggle, mouseX, mouseY }) {
  const isArman = activeMascot === "arman";
  const msgs = isArman ? ARMAN_MSGS : ZARA_MSGS;
  const [msgIdx, setMsgIdx] = useState(0);
  const cycleMsg = () => setMsgIdx((i) => (i + 1) % msgs.length);
  const accentColor = isArman ? ACCENT_A : ACCENT_Z;

  return (
    <FloatingPanel defaultX={40} defaultY={80} width={280} height={420} glowColor={accentColor} zBase={10}>
      <div className="panel-head">
        <span className="panel-title"><Brain size={12} />Nexus</span>
        <motion.button className="neu-btn" style={{ padding: "5px 10px", fontSize: "10px", background: "rgba(255,255,255,0.06)", color: "rgba(228,228,255,0.6)" }} whileTap={{ scale: 0.93 }} onClick={onToggle}>
          <RefreshCw size={10} />{isArman ? "Arman" : "Zara"}
        </motion.button>
      </div>

      {/* 3D Model preview (small) */}
      <div style={{ height: 180, width: "100%", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <MascotStage3D activeMascot={activeMascot} mouseX={mouseX} mouseY={mouseY} accentColor={accentColor} />
        {/* Orbit ring overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div style={{ width: 120, height: 120, borderRadius: "50%", border: `1px solid ${accentColor}22` }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
        </div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, background: `linear-gradient(135deg, ${accentColor}, ${isArman ? "#c084fc" : "#38bdf8"})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {isArman ? "Arman" : "Zara"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(228,228,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            {isArman ? "Logic · Programming" : "Data · Analytics"}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={msgIdx + activeMascot}
            initial={{ scale: 0.85, opacity: 0, y: 6 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ background: isArman ? "rgba(124,92,252,0.15)" : "rgba(0,229,176,0.1)", border: `1px solid ${isArman ? "rgba(124,92,252,0.25)" : "rgba(0,229,176,0.2)"}`, borderRadius: "12px 12px 12px 4px", padding: "10px 13px", fontSize: 11.5, lineHeight: 1.65, color: "rgba(228,228,255,0.85)", cursor: "pointer" }}
            onClick={cycleMsg}>
            {msgs[msgIdx]}
            <div style={{ fontSize: 9, color: "rgba(228,228,255,0.3)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={8} /> tap to cycle</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </FloatingPanel>
  );
}

// ─── SENTIENT BUD PANEL (Cat + mood picker) ───────────────────────────────────
function BudPanel({ emotion, onSetEmotion, xp, streak, theme, mouseX, mouseY }) {
  const [showRadial, setShowRadial] = useState(false);
  const catVariants = {
    happy:       { y: [0, -12, 0],   transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
    angry:       { x: [-3, 3, -3],   transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" } },
    mischievous: { rotate: [-4, 4, -4], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
    sad:         { y: [0, 4, 0],     transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } },
  };

  return (
    <FloatingPanel defaultX={750} defaultY={490} width={300} height={310} glowColor={theme.color} zBase={9}>
      <div className="panel-head">
        <span className="panel-title"><Sparkles size={12} />Bud — Sentient</span>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: `${theme.color}22`, color: theme.color, fontWeight: 700, letterSpacing: "0.5px" }}>
          {theme.label}
        </span>
      </div>

      <motion.div
        onClick={() => setShowRadial((s) => !s)}
        style={{ height: "calc(100% - 50px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", position: "relative", cursor: "pointer" }}
        animate={{ boxShadow: `inset 0 0 30px ${theme.color}06` }}
      >
        {/* Mood meter */}
        <div style={{ position: "absolute", top: 10, left: 14, right: 14 }}>
          <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.35, marginBottom: 4, textTransform: "uppercase" }}>Mood</div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div animate={{ width: `${theme.mood}%`, background: theme.color }} transition={{ duration: 1, ease: "easeInOut" }} style={{ height: "100%", borderRadius: 3 }} />
          </div>
        </div>

        {/* Speech bubble */}
        <AnimatePresence mode="wait">
          <motion.div key={emotion}
            initial={{ opacity: 0, y: 8, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", padding: "6px 16px", borderRadius: 999, fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap", marginTop: 22 }}>
            {theme.quote}
          </motion.div>
        </AnimatePresence>

        {/* Cat */}
        <motion.div animate={catVariants[emotion]} style={{ width: 100, height: 100, position: "relative" }}>
          <CatSVG emotion={emotion} color={theme.color} mouseX={mouseX} mouseY={mouseY} />
        </motion.div>

        <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: "0.35em", opacity: 0.25, textTransform: "uppercase" }}>
          XP {xp.toLocaleString()} · {streak > 0 ? `🔥 ${streak} day streak` : "no streak"}
        </div>

        {/* Radial emotion picker */}
        <AnimatePresence>
          {showRadial && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", borderRadius: 16, backdropFilter: "blur(4px)" }} />
              {Object.entries(THEMES).map(([id, t], i) => {
                const angles = [270, 90, 180, 0];
                const rad = (angles[i] * Math.PI) / 180;
                const dist = 85;
                return (
                  <motion.button key={id}
                    initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                    animate={{ scale: 1, opacity: 1, x: Math.cos(rad) * dist, y: Math.sin(rad) * dist }}
                    exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24, delay: i * 0.05 }}
                    whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onSetEmotion(id); setShowRadial(false); }}
                    style={{ position: "absolute", width: 48, height: 48, borderRadius: "50%", background: emotion === id ? `${t.color}33` : "rgba(15,15,25,0.9)", border: `1.5px solid ${emotion === id ? t.color : "rgba(255,255,255,0.2)"}`, backdropFilter: "blur(20px)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
                    {t.emoji}
                  </motion.button>
                );
              })}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.45, zIndex: 50 }}>
                Pick Mood
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </FloatingPanel>
  );
}

// ─── ROOM PANEL ───────────────────────────────────────────────────────────────
function RoomPanel({ subjects, onSliderChange, cgpa }) {
  const goalPct = Math.min(100, ((parseFloat(cgpa) - 7.5) / 2.5) * 100);
  return (
    <FloatingPanel defaultX={360} defaultY={60} width={340} height={420} glowColor="#fbbf24" zBase={12}>
      <div className="panel-head">
        <span className="panel-title"><BookOpen size={12} />The Room</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: 9, color: "rgba(228,228,255,0.4)", letterSpacing: "1px", textTransform: "uppercase" }}>CGPA</div>
          <motion.div key={cgpa} initial={{ scale: 1.3, color: "#fbbf24" }} animate={{ scale: 1, color: "#fbbf24" }} style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{cgpa}</motion.div>
          <div style={{ fontSize: 9, color: "rgba(228,228,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}><TrendingUp size={8} /> Goal: 8.5</div>
        </div>
      </div>
      <div style={{ padding: "10px 18px 6px" }}>
        <div style={{ fontSize: 9, color: "rgba(228,228,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
          <span>Trajectory</span><span style={{ color: "#fbbf24" }}>{cgpa} / 8.5</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <motion.div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #7c5cfc, #fbbf24)", originX: 0 }} animate={{ width: `${goalPct}%` }} transition={{ type: "spring", stiffness: 60, damping: 15 }} />
        </div>
      </div>
      <div style={{ padding: "8px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {subjects.map((sub) => {
          const Icon = sub.icon;
          return (
            <div key={sub.id} className="slider-wrap">
              <div className="slider-row">
                <div className="slider-label"><Icon size={11} color={sub.color} /><span style={{ fontSize: 10.5 }}>{sub.name}</span></div>
                <motion.span className="slider-pct" style={{ color: sub.color }} key={sub.progress} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>{sub.progress}%</motion.span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="range" min={0} max={100} value={sub.progress} style={{ accentColor: sub.color }} onChange={(e) => onSliderChange(sub.id, Number(e.target.value))} />
                {sub.progress < 50 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(248,113,113,0.2)", color: "#f87171", fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={8} /> Lagging</motion.span>}
                {sub.progress >= 80 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(0,229,176,0.15)", color: ACCENT_Z, fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle2 size={8} /> Excellent</motion.span>}
              </div>
            </div>
          );
        })}
      </div>
    </FloatingPanel>
  );
}

// ─── FORGE PANEL ──────────────────────────────────────────────────────────────
function ForgePanel() {
  const [code, setCode] = useState("");
  const [tasks, setTasks] = useState([]);
  const [shattering, setShattering] = useState(false);
  const forge = () => {
    if (!code.trim()) return;
    setShattering(true);
    setTimeout(() => { setTasks(shatterCode(code)); setShattering(false); }, 600);
  };
  const toggleTask = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  return (
    <FloatingPanel defaultX={40} defaultY={530} width={310} height={290} glowColor={ACCENT_A} zBase={11}>
      <div className="panel-head">
        <span className="panel-title"><Zap size={12} />The Forge</span>
        <motion.button className="neu-btn" style={{ padding: "5px 10px", fontSize: "10px", background: "linear-gradient(135deg, rgba(124,92,252,0.3), rgba(124,92,252,0.1))", color: ACCENT_A, border: "1px solid rgba(124,92,252,0.3)" }} whileTap={{ scale: 0.92 }} onClick={forge}>
          <Zap size={10} /> Shatter
        </motion.button>
      </div>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10, height: "calc(100% - 50px)", overflow: "hidden" }}>
        <motion.textarea
          style={{ width: "100%", height: 75, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(228,228,255,0.8)", fontFamily: "'DM Sans', monospace", fontSize: 11, padding: "8px 10px", resize: "none", outline: "none", lineHeight: 1.6 }}
          placeholder="Paste code or tasks here…&#10;Each line becomes a floating bubble!"
          value={code} onChange={(e) => setCode(e.target.value)} whileFocus={{ borderColor: "rgba(124,92,252,0.5)" }} />
        <AnimatePresence>
          {shattering && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", fontSize: 11, color: ACCENT_A, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}><RefreshCw size={12} color={ACCENT_A} /></motion.div>
            Shattering into atoms…
          </motion.div>}
        </AnimatePresence>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 2 }}>
          <AnimatePresence>
            {tasks.map((task, i) => (
              <motion.div key={task.id} className="task-bubble"
                initial={{ scale: 0, rotate: Math.random() * 40 - 20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.06 }}
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={() => toggleTask(task.id)}
                style={{ textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.45 : 1, background: task.done ? "rgba(0,229,176,0.15)" : undefined, borderColor: task.done ? "rgba(0,229,176,0.3)" : undefined, color: task.done ? ACCENT_Z : undefined }}>
                {task.done ? <CheckCircle2 size={9} /> : <Code2 size={9} />}{task.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {tasks.length === 0 && !shattering && <div style={{ fontSize: 10.5, color: "rgba(228,228,255,0.2)", padding: "8px 4px", display: "flex", alignItems: "center", gap: 5 }}><Cpu size={12} /> Raw data awaits the forge…</div>}
        </div>
      </div>
    </FloatingPanel>
  );
}

// ─── COMIC SLOT (Chat) ────────────────────────────────────────────────────────
function ComicPanel({ activeMascot }) {
  const isArman = activeMascot === "arman";
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Yaar, I've been analysing your study patterns. Let's make today count!", mascot: "arman" },
    { role: "ai", text: "CGPA trajectory looking good! Zara has a study plan optimised for your peak hours.", mascot: "zara" },
  ]);
  const [input, setInput] = useState("");
  const threadRef = useRef(null);
  const send = () => {
    if (!input.trim()) return;
    const pool = isArman ? ARMAN_MSGS : ZARA_MSGS;
    const aiReply = { role: "ai", text: pool[Math.floor(Math.random() * pool.length)], mascot: activeMascot };
    setMsgs((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => { setMsgs((prev) => [...prev, aiReply]); setTimeout(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, 50); }, 650);
  };
  return (
    <FloatingPanel defaultX={750} defaultY={60} width={290} height={410} glowColor={isArman ? ACCENT_A : ACCENT_Z} zBase={13}>
      <div className="panel-head">
        <span className="panel-title"><Activity size={12} />Comic-Slot</span>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(124,92,252,0.25)", color: ACCENT_A, fontWeight: 700, letterSpacing: "0.5px" }}>LIVE</span>
      </div>
      <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", height: "calc(100% - 100px)" }}>
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ x: m.role === "user" ? 20 : -20, opacity: 0, scale: 0.9 }} animate={{ x: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}
              style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
              {m.role === "ai" && <div style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, marginRight: 6, marginTop: 2, background: m.mascot === "arman" ? "rgba(124,92,252,0.3)" : "rgba(0,229,176,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: m.mascot === "arman" ? ACCENT_A : ACCENT_Z }}>{m.mascot === "arman" ? "A" : "Z"}</div>}
              <div className={`chat-bubble ${m.role === "ai" ? (m.mascot === "zara" ? "ai zara-style" : "ai") : "user"}`}>{m.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, background: "rgba(0,0,0,0.2)" }}>
        <input style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 10px", color: "rgba(228,228,255,0.85)", fontFamily: "'DM Sans', sans-serif", fontSize: 11, outline: "none" }}
          placeholder={`Ask ${isArman ? "Arman" : "Zara"}…`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <motion.button style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${ACCENT_A}, #9f7aea)`, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${ACCENT_A}55` }} whileTap={{ scale: 0.9 }} onClick={send}><Send size={13} /></motion.button>
      </div>
    </FloatingPanel>
  );
}

// ─── STATS PANEL ──────────────────────────────────────────────────────────────
function StatsPanel() {
  const stats = [
    { label: "Focus Streak", value: "5 days", icon: Star, color: "#f59e0b" },
    { label: "Sessions Today", value: "3 / 4", icon: Activity, color: ACCENT_A },
    { label: "Tasks Forged", value: "12", icon: Zap, color: ACCENT_Z },
    { label: "Network Score", value: "94%", icon: Network, color: "#38bdf8" },
  ];
  return (
    <FloatingPanel defaultX={390} defaultY={510} width={300} height={230} glowColor={ACCENT_Z} zBase={9}>
      <div className="panel-head"><span className="panel-title"><BarChart3 size={12} />Vitals</span><Bell size={13} color="rgba(228,228,255,0.3)" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "12px 16px" }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.06)" }} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px", cursor: "default", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Icon size={15} color={s.color} style={{ marginBottom: 6 }} />
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9.5, color: "rgba(228,228,255,0.35)", marginTop: 3, letterSpacing: "0.4px" }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </FloatingPanel>
  );
}

// ─── FLOATING NOTIFS ──────────────────────────────────────────────────────────
function FloatingNotifs() {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    const spawn = () => { const n = NOTIF_POOL[Math.floor(Math.random() * NOTIF_POOL.length)]; const id = Date.now(); setNotifs((prev) => [...prev.slice(-3), { ...n, id }]); setTimeout(() => setNotifs((prev) => prev.filter((x) => x.id !== id)), 5000); };
    spawn(); const interval = setInterval(spawn, 7000); return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 70, right: 24, zIndex: 300, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      <AnimatePresence>
        {notifs.map((n) => { const Icon = n.icon; return (
          <motion.div key={n.id} initial={{ y: 40, opacity: 0, x: 20 }} animate={{ y: 0, opacity: 1, x: 0 }} exit={{ y: -20, opacity: 0, x: 20 }} transition={{ type: "spring", stiffness: 180, damping: 20 }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "rgba(10,8,25,0.9)", backdropFilter: "blur(20px)", border: `1px solid ${n.color}44`, borderLeft: `3px solid ${n.color}`, fontSize: 11.5, color: "rgba(228,228,255,0.85)", boxShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 20px ${n.color}22`, maxWidth: 280, pointerEvents: "auto" }}>
            <Icon size={13} color={n.color} />{n.text}
          </motion.div>
        ); })}
      </AnimatePresence>
    </div>
  );
}

// ─── BREAK OVERLAY ────────────────────────────────────────────────────────────
function BreakOverlay({ show, onDismiss, activeMascot }) {
  const isArman = activeMascot === "arman";
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="break-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="break-card" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} transition={{ type: "spring", stiffness: 150, damping: 18 }}>
            <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ marginBottom: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto", background: `radial-gradient(circle, ${isArman ? ACCENT_A : ACCENT_Z}44 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${isArman ? ACCENT_A : ACCENT_Z}44` }}>
                <Eye size={36} color={isArman ? ACCENT_A : ACCENT_Z} />
              </div>
            </motion.div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 14, background: `linear-gradient(135deg, ${isArman ? ACCENT_A : ACCENT_Z}, ${isArman ? "#c084fc" : "#38bdf8"})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Hey Jouzia — Brain Break!
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(228,228,255,0.7)", marginBottom: 30 }}>
              {isArman ? <>Yaar, your brain is <strong style={{ color: ACCENT_A }}>literally melting</strong>. 30 minutes straight!<br /><br />"<em>Step away 5 mins or I'm locking the Forge! <span style={{ color: ACCENT_Z }}>Chai pi lo, phir wapas aao.</span></em>" — Arman</>
                : <>Data says: <strong style={{ color: ACCENT_Z }}>eye strain risk 94%</strong>. Focus efficiency dropping.<br /><br />"<em>Walk. Stretch. Drink water. <span style={{ color: "#38bdf8" }}>Wapas aane ke baad results kaafi better honge!</span></em>" — Zara</>}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <motion.button style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${ACCENT_A}, #9f7aea)`, color: "white", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onDismiss}>
                <Coffee size={15} /> Taking a break!
              </motion.button>
              <motion.button style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(228,228,255,0.5)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} whileHover={{ background: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.96 }} onClick={onDismiss}>
                <X size={14} /> 5 more mins…
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function TopBar({ cgpa, focusSec, onBreakPreview, activeMascot, emotion, theme }) {
  const pad = (n) => String(n).padStart(2, "0");
  const mins = Math.floor(focusSec / 60);
  const secs = focusSec % 60;
  return (
    <div className="topbar">
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, background: `linear-gradient(135deg, ${ACCENT_A}, ${ACCENT_Z})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        OpenEnv <span style={{ fontWeight: 300, WebkitTextFillColor: "rgba(228,228,255,0.4)" }}>/ Bud AI</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Bud mood chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: theme.color, padding: "4px 10px", background: `${theme.color}11`, borderRadius: 20, border: `1px solid ${theme.color}33` }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.color }} animate={{ boxShadow: [`0 0 4px ${theme.color}`, `0 0 12px ${theme.color}`, `0 0 4px ${theme.color}`] }} transition={{ duration: 2, repeat: Infinity }} />
          {theme.emoji} {theme.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(228,228,255,0.5)", padding: "5px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: "50%", background: activeMascot === "arman" ? ACCENT_A : ACCENT_Z }} animate={{ boxShadow: [`0 0 4px ${ACCENT_A}`, `0 0 12px ${ACCENT_A}`, `0 0 4px ${ACCENT_A}`] }} transition={{ duration: 2, repeat: Infinity }} />
          {activeMascot === "arman" ? "Arman — Logic" : "Zara — Analytics"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(228,228,255,0.5)", padding: "5px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
          <Clock size={11} />{pad(mins)}:{pad(secs)}
        </div>
        <div style={{ fontSize: 11.5, color: "#fbbf24", padding: "5px 12px", background: "rgba(251,191,36,0.08)", borderRadius: 20, border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", gap: 5 }}>
          <BarChart3 size={11} /> CGPA {cgpa} / 8.5
        </div>
        <motion.button className="neu-btn" style={{ padding: "6px 12px", fontSize: 11, background: "rgba(255,255,255,0.05)", color: "rgba(228,228,255,0.5)", border: "1px solid rgba(255,255,255,0.09)" }} whileTap={{ scale: 0.93 }} onClick={onBreakPreview}>
          <Moon size={11} /> Break
        </motion.button>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeMascot, setActiveMascot] = useState("arman");
  const [subjects, setSubjects] = useState(
    SUBJECTS.map((s) => ({ ...s, progress: s.id === "oop" ? 41 : s.id === "dsa" ? 72 : s.id === "db" ? 85 : 58 }))
  );
  const [breakVisible, setBreakVisible] = useState(false);
  const [focusSec, setFocusSec] = useState(1800);

  // SentientGrid state
  const [emotion, setEmotion] = useState("happy");
  const [xp, setXp] = useState(4820);
  const [streak] = useState(12);
  const [toasts, setToasts] = useState([]);
  const [ripples, setRipples] = useState([]);
  const toastId = useRef(0);
  const rippleId = useRef(0);
  const theme = THEMES[emotion];

  // Mouse tracking for Antigravity 3D
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const handleMouseMove = useCallback((e) => {
    setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
    setMouseY((e.clientY / window.innerHeight - 0.5) * 2);
  }, []);

  const cgpa = computeCGPA(subjects);

  // Focus timer
  useEffect(() => {
    const interval = setInterval(() => {
      setFocusSec((prev) => { if (prev <= 1) { setBreakVisible(true); return 1800; } return prev - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSlider = useCallback((id, val) => {
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, progress: val } : s));
  }, []);

  const showToast = useCallback((msg) => { const id = ++toastId.current; setToasts((prev) => [...prev, { id, msg }]); }, []);

  const handleSetEmotion = useCallback((id) => {
    setEmotion(id);
    showToast(THEMES[id].xpLabel);
    setXp((prev) => prev + 50);
  }, [showToast]);

  const handleRipple = useCallback((e) => {
    const id = ++rippleId.current;
    setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <Starfield />
      <CustomCursor />
      <GridBG />

      {/* Adaptive aura from SentientGrid */}
      <motion.div
        animate={{ background: [`radial-gradient(ellipse 60% 60% at 25% 25%, ${theme.aura1}22, transparent), radial-gradient(ellipse 50% 50% at 75% 75%, ${theme.aura2}16, transparent)`] }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />

      {/* Antigravity ambient blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <motion.div animate={{ x: [0, 80, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT_A}18 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -60, 0], y: [0, 50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT_Z}14 0%, transparent 70%)`, filter: "blur(40px)" }} />
      </div>

      {/* Click ripples */}
      {ripples.map((r) => (
        <motion.div key={r.id} initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: 10, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ position: "fixed", left: r.x, top: r.y, width: 60, height: 60, borderRadius: "50%", border: `1.5px solid ${theme.color}55`, transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 5 }} />
      ))}

      {/* XP Toasts */}
      <AnimatePresence>
        {toasts.map((t) => <XPToast key={t.id} msg={t.msg} color={theme.color} onDone={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />)}
      </AnimatePresence>

      <TopBar cgpa={cgpa} focusSec={focusSec} onBreakPreview={() => setBreakVisible(true)} activeMascot={activeMascot} emotion={emotion} theme={theme} />

      {/* Panels container */}
      <div onMouseMove={handleMouseMove} style={{ position: "fixed", inset: 0, top: 52, zIndex: 10 }} onClick={handleRipple}>
        <NexusPanel activeMascot={activeMascot} onToggle={() => setActiveMascot((m) => m === "arman" ? "zara" : "arman")} mouseX={mouseX} mouseY={mouseY} />
        <RoomPanel subjects={subjects} onSliderChange={handleSlider} cgpa={cgpa} />
        <ForgePanel />
        <ComicPanel activeMascot={activeMascot} />
        <StatsPanel />
        <BudPanel emotion={emotion} onSetEmotion={handleSetEmotion} xp={xp} streak={streak} theme={theme} mouseX={mouseX} mouseY={mouseY} />
      </div>

      <FloatingNotifs />
      <BreakOverlay show={breakVisible} onDismiss={() => setBreakVisible(false)} activeMascot={activeMascot} />

      {/* Status bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 44, background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontSize: 10.5, color: "rgba(228,228,255,0.35)", zIndex: 200, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {[{ label: "Sentient Core", ok: true }, { label: "Antigravity Physics", ok: true }, { label: "3D Models", ok: true }].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.ok ? ACCENT_Z : ACCENT_WARN, boxShadow: `0 0 6px ${s.ok ? ACCENT_Z : ACCENT_WARN}` }} />{s.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ChevronRight size={10} /> Jouzia · CGPA {cgpa} / 8.5</span>
          <span>Semester 4 · Week 11</span>
          <span style={{ color: "rgba(228,228,255,0.2)" }}>OpenEnv v3.0 — Antigravity + Sentient</span>
        </div>
      </div>
    </>
  );
}
