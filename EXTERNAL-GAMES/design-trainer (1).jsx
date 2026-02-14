import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const MODULES = [
  { id: "easing", name: "Easing Curves", icon: "〰", cat: "animation" },
  { id: "timing", name: "Timing Sense", icon: "⏱", cat: "animation" },
  { id: "keyframes", name: "Keyframe Order", icon: "⬥", cat: "animation" },
  { id: "bezier", name: "Bézier Match", icon: "⌒", cat: "animation" },
  { id: "color", name: "Color Match", icon: "◉", cat: "design" },
  { id: "contrast", name: "Contrast Ratio", icon: "◐", cat: "design" },
  { id: "spacing", name: "Spacing Eye", icon: "⊞", cat: "design" },
  { id: "transform3d", name: "3D Transform", icon: "⬡", cat: "3d" },
  { id: "perspective", name: "Perspective", icon: "◇", cat: "3d" },
  { id: "shader", name: "Shader Code", icon: "▦", cat: "shader" },
  { id: "uniforms", name: "Uniform Tuner", icon: "◈", cat: "shader" },
  { id: "gradient", name: "Gradient Build", icon: "▨", cat: "shader" },
];

const CATS = { animation: "#f472b6", design: "#60a5fa", "3d": "#a78bfa", shader: "#34d399" };

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }
function lerp(a, b, t) { return a + (b - a) * t; }
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rand(0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }

const EASINGS = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInBack: t => t * t * (2.70158 * t - 1.70158),
  easeOutBack: t => { const c = 1.70158; return 1 + (--t) * t * ((c + 1) * t + c); },
  easeOutBounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
};

function Score({ score, total, onBack }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>{pct}%</div>
      <div style={{ opacity: 0.5, marginBottom: 24 }}>{score} / {total} correct</div>
      <button onClick={onBack} style={btnStyle}>Back to modules</button>
    </div>
  );
}

function EasingModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [animT, setAnimT] = useState(0);
  const animRef = useRef(null);
  const total = 8;

  const question = useMemo(() => {
    const keys = Object.keys(EASINGS);
    const correct = pick(keys);
    let opts = [correct];
    while (opts.length < 4) { const o = pick(keys); if (!opts.includes(o)) opts.push(o); }
    return { correct, options: shuffle(opts) };
  }, [round]);

  useEffect(() => {
    let start = null;
    let id;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1500;
      if (elapsed >= 1) { start = ts; }
      setAnimT(elapsed % 1);
      id = requestAnimationFrame(animate);
    };
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [round]);

  const easedT = EASINGS[question.correct](animT);
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.beginPath();
    ctx.strokeStyle = "#666";
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const v = EASINGS[question.correct](t);
      const x = 10 + t * (w - 20);
      const y = h - 10 - v * (h - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "#f472b6";
    const cx = 10 + animT * (w - 20);
    const cy = h - 10 - easedT * (h - 20);
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }, [animT, question]);

  const check = (opt) => {
    setAnswer(opt);
    if (opt === question.correct) setScore(s => s + 1);
    setTimeout(() => {
      setAnswer(null);
      if (round + 1 >= total) onDone(score + (opt === question.correct ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 800);
  };

  return (
    <div>
      <Header title="Easing Curves" sub={`Identify the easing function — Round ${round + 1}/${total}`} />
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto" }}>
          <canvas ref={canvasRef} width={200} height={200} style={{ background: "#1a1a2e", borderRadius: 8 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            width: `${easedT * 100}%`,
            height: 8,
            background: "#f472b6",
            borderRadius: 4,
            transition: "none",
            marginBottom: 16,
          }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {question.options.map(o => (
              <button
                key={o}
                onClick={() => !answer && check(o)}
                disabled={!!answer}
                style={{
                  ...btnStyle,
                  background: answer ? (o === question.correct ? "#22c55e22" : o === answer ? "#ef444422" : "#ffffff08") : "#ffffff08",
                  border: answer && o === question.correct ? "1px solid #22c55e" : "1px solid #ffffff15",
                  color: answer && o === question.correct ? "#22c55e" : "#ccc",
                  fontSize: 12,
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimingModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [startT, setStartT] = useState(0);
  const total = 6;

  const targetMs = useMemo(() => pick([200, 300, 500, 700, 1000, 1500, 2000]), [round]);
  const boxRef = useRef(null);

  const play = () => {
    setPlaying(true);
    const el = boxRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "translateX(0)";
    requestAnimationFrame(() => {
      el.style.transition = `transform ${targetMs}ms ease-out`;
      el.style.transform = "translateX(220px)";
    });
    setTimeout(() => setPlaying(false), targetMs + 100);
  };

  useEffect(() => { play(); }, [round]);

  const options = useMemo(() => {
    let opts = [targetMs];
    while (opts.length < 4) {
      const v = pick([100, 200, 300, 500, 700, 1000, 1500, 2000, 2500]);
      if (!opts.includes(v)) opts.push(v);
    }
    return shuffle(opts);
  }, [round, targetMs]);

  const check = (v) => {
    setAnswer(v);
    if (v === targetMs) setScore(s => s + 1);
    setTimeout(() => {
      setAnswer(null);
      if (round + 1 >= total) onDone(score + (v === targetMs ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 800);
  };

  return (
    <div>
      <Header title="Timing Sense" sub={`Estimate the animation duration — Round ${round + 1}/${total}`} />
      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 16, marginBottom: 16, height: 60, position: "relative", overflow: "hidden" }}>
        <div ref={boxRef} style={{ width: 32, height: 32, background: "#f472b6", borderRadius: 6, position: "absolute", top: 14 }} />
      </div>
      <button onClick={play} style={{ ...btnStyle, marginBottom: 12, fontSize: 12 }}>▶ Replay</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {options.map(o => (
          <button
            key={o}
            onClick={() => !answer && check(o)}
            disabled={!!answer}
            style={{
              ...btnStyle,
              background: answer ? (o === targetMs ? "#22c55e22" : o === answer ? "#ef444422" : "#ffffff08") : "#ffffff08",
              border: answer && o === targetMs ? "1px solid #22c55e" : "1px solid #ffffff15",
              color: answer && o === targetMs ? "#22c55e" : "#ccc",
            }}
          >
            {o}ms
          </button>
        ))}
      </div>
    </div>
  );
}

function KeyframesModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const total = 5;

  const question = useMemo(() => {
    const sets = [
      { desc: "Fade in and slide up", correct: ["opacity: 0", "transform: translateY(20px)", "opacity: 1", "transform: translateY(0)"] },
      { desc: "Scale bounce effect", correct: ["transform: scale(0)", "transform: scale(1.2)", "transform: scale(0.9)", "transform: scale(1)"] },
      { desc: "Rotate 360° with fade", correct: ["opacity: 0; rotate: 0deg", "opacity: 1; rotate: 120deg", "opacity: 1; rotate: 240deg", "opacity: 1; rotate: 360deg"] },
      { desc: "Slide left and fade out", correct: ["transform: translateX(0); opacity: 1", "transform: translateX(-30%)", "transform: translateX(-70%); opacity: 0.5", "transform: translateX(-100%); opacity: 0"] },
      { desc: "Pulse scale animation", correct: ["transform: scale(1)", "transform: scale(1.15)", "transform: scale(1)", "transform: scale(0.95)"] },
      { desc: "Elastic entrance", correct: ["transform: scale(0)", "transform: scale(1.25)", "transform: scale(0.85)", "transform: scale(1)"] },
    ];
    const s = sets[round % sets.length];
    return { ...s, shuffled: shuffle(s.correct.map((v, i) => ({ v, i }))) };
  }, [round]);

  const [order, setOrder] = useState([]);
  const remaining = question.shuffled.filter(s => !order.find(o => o.i === s.i));

  useEffect(() => { setOrder([]); }, [round]);

  const addToOrder = (item) => {
    const next = [...order, item];
    setOrder(next);
    if (next.length === question.correct.length) {
      const correct = next.every((o, i) => o.i === i);
      if (correct) setScore(s => s + 1);
      setFeedback(correct);
      setTimeout(() => {
        setFeedback(null);
        if (round + 1 >= total) onDone(score + (correct ? 1 : 0), total);
        else setRound(r => r + 1);
      }, 1000);
    }
  };

  return (
    <div>
      <Header title="Keyframe Order" sub={`Arrange keyframes in correct order — ${round + 1}/${total}`} />
      <p style={{ opacity: 0.6, fontSize: 13, margin: "0 0 12px" }}>Animation: <strong>{question.desc}</strong></p>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 6 }}>Your order:</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 36 }}>
          {order.map((o, i) => (
            <div key={i} style={{ background: "#ffffff12", padding: "4px 10px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", border: feedback !== null ? (o.i === i ? "1px solid #22c55e" : "1px solid #ef4444") : "1px solid #ffffff20" }}>
              {o.v}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {remaining.map((s) => (
          <button
            key={s.i}
            onClick={() => feedback === null && addToOrder(s)}
            style={{ ...btnStyle, fontSize: 12, fontFamily: "monospace", padding: "6px 12px" }}
          >
            {s.v}
          </button>
        ))}
      </div>
      {order.length > 0 && feedback === null && (
        <button onClick={() => setOrder([])} style={{ ...btnStyle, marginTop: 8, fontSize: 11, opacity: 0.6 }}>Reset</button>
      )}
    </div>
  );
}

function BezierModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const total = 5;
  const W = 220, H = 220, P = 20;

  const target = useMemo(() => ({
    x1: Math.round((rand(5, 85)) / 100 * 100) / 100,
    y1: Math.round((rand(-20, 140)) / 100 * 100) / 100,
    x2: Math.round((rand(15, 95)) / 100 * 100) / 100,
    y2: Math.round((rand(-20, 140)) / 100 * 100) / 100,
  }), [round]);

  const [cp1, setCp1] = useState({ x: 0.25, y: 0.1 });
  const [cp2, setCp2] = useState({ x: 0.75, y: 0.9 });
  const dragging = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    setCp1({ x: 0.25, y: 0.1 });
    setCp2({ x: 0.75, y: 0.9 });
    setFeedback(null);
  }, [round]);

  const toSvg = (nx, ny) => ({ x: P + nx * (W - 2 * P), y: H - P - ny * (H - 2 * P) });
  const fromSvg = (sx, sy) => ({ x: clamp((sx - P) / (W - 2 * P), 0, 1), y: clamp((H - P - sy) / (H - 2 * P), -0.3, 1.3) });

  const onPointerDown = (which) => (e) => { dragging.current = which; e.target.setPointerCapture(e.pointerId); };
  const onPointerMove = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = fromSvg(e.clientX - rect.left, e.clientY - rect.top);
    if (dragging.current === 1) setCp1(p);
    else setCp2(p);
  };
  const onPointerUp = () => { dragging.current = null; };

  const check = () => {
    const dist = Math.sqrt((cp1.x - target.x1) ** 2 + (cp1.y - target.y1) ** 2 + (cp2.x - target.x2) ** 2 + (cp2.y - target.y2) ** 2);
    const pass = dist < 0.35;
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1000);
  };

  const s = toSvg(0, 0), e = toSvg(1, 1);
  const tc1 = toSvg(target.x1, target.y1), tc2 = toSvg(target.x2, target.y2);
  const mc1 = toSvg(cp1.x, cp1.y), mc2 = toSvg(cp2.x, cp2.y);

  return (
    <div>
      <Header title="Bézier Match" sub={`Match the target curve — ${round + 1}/${total}`} />
      <p style={{ fontSize: 12, opacity: 0.5, margin: "0 0 8px" }}>
        Target: cubic-bezier({target.x1}, {target.y1}, {target.x2}, {target.y2})
      </p>
      <div style={{ display: "flex", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
        <svg ref={svgRef} width={W} height={H} style={{ background: "#1a1a2e", borderRadius: 8, cursor: "crosshair", touchAction: "none" }}
          onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="none" stroke="#ffffff10" />
          <path d={`M${s.x},${s.y} C${tc1.x},${tc1.y} ${tc2.x},${tc2.y} ${e.x},${e.y}`} fill="none" stroke="#f472b644" strokeWidth={2} strokeDasharray="4,4" />
          <path d={`M${s.x},${s.y} C${mc1.x},${mc1.y} ${mc2.x},${mc2.y} ${e.x},${e.y}`} fill="none" stroke="#60a5fa" strokeWidth={2} />
          <line x1={s.x} y1={s.y} x2={mc1.x} y2={mc1.y} stroke="#ffffff30" strokeWidth={1} />
          <line x1={e.x} y1={e.y} x2={mc2.x} y2={mc2.y} stroke="#ffffff30" strokeWidth={1} />
          <circle cx={mc1.x} cy={mc1.y} r={8} fill="#60a5fa" style={{ cursor: "grab" }}
            onPointerDown={onPointerDown(1)} />
          <circle cx={mc2.x} cy={mc2.y} r={8} fill="#a78bfa" style={{ cursor: "grab" }}
            onPointerDown={onPointerDown(2)} />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontFamily: "monospace", opacity: 0.6, marginBottom: 12 }}>
            Your: cubic-bezier({cp1.x.toFixed(2)}, {cp1.y.toFixed(2)}, {cp2.x.toFixed(2)}, {cp2.y.toFixed(2)})
          </div>
          {feedback !== null ? (
            <div style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
              {feedback ? "Close enough!" : "Too far off"}
            </div>
          ) : (
            <button onClick={check} style={btnStyle}>Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ColorModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [userColor, setUserColor] = useState("#808080");
  const total = 6;

  const target = useMemo(() => {
    const h = rand(0, 360), s = rand(30, 90), l = rand(25, 75);
    return { h, s, l, hex: hslToHex(h, s, l) };
  }, [round]);

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, "0"); };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  const check = () => {
    const t = hexToRgb(target.hex), u = hexToRgb(userColor);
    const dist = Math.sqrt((t.r - u.r) ** 2 + (t.g - u.g) ** 2 + (t.b - u.b) ** 2);
    const pass = dist < 60;
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      setFeedback(null);
      setUserColor("#808080");
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1200);
  };

  return (
    <div>
      <Header title="Color Match" sub={`Match the target color — ${round + 1}/${total}`} />
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4 }}>Target</div>
          <div style={{ width: 80, height: 80, background: target.hex, borderRadius: 8, border: "1px solid #ffffff15" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4 }}>Your pick</div>
          <div style={{ width: 80, height: 80, background: userColor, borderRadius: 8, border: "1px solid #ffffff15" }} />
        </div>
        {feedback !== null && (
          <div>
            <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4 }}>Answer</div>
            <div style={{ fontFamily: "monospace", fontSize: 13 }}>{target.hex}</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input type="color" value={userColor} onChange={e => setUserColor(e.target.value)}
          style={{ width: 48, height: 36, border: "none", background: "none", cursor: "pointer" }} />
        <input type="text" value={userColor} onChange={e => setUserColor(e.target.value)}
          style={{ ...inputStyle, width: 100, fontFamily: "monospace" }} />
        {feedback === null && <button onClick={check} style={btnStyle}>Check</button>}
        {feedback !== null && <span style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{feedback ? "Close!" : "Too far"}</span>}
      </div>
    </div>
  );
}

function ContrastModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const total = 6;

  const question = useMemo(() => {
    const bgL = rand(10, 90);
    const fgL = bgL > 50 ? rand(0, 30) : rand(70, 100);
    const h = rand(0, 360);
    const bg = hsl(h, rand(20, 60), bgL);
    const fg = hsl((h + rand(0, 60)) % 360, rand(20, 60), fgL);
    const L1 = Math.max(bgL, fgL) + 5;
    const L2 = Math.min(bgL, fgL) + 5;
    const ratio = (L1 / L2);
    const rounded = Math.round(ratio * 10) / 10;
    let opts = [rounded];
    while (opts.length < 4) {
      const v = Math.round((rounded + (Math.random() * 8 - 4)) * 10) / 10;
      if (v > 1 && !opts.includes(v)) opts.push(v);
    }
    return { bg, fg, ratio: rounded, options: shuffle(opts) };
  }, [round]);

  const check = (v) => {
    setAnswer(v);
    if (v === question.ratio) setScore(s => s + 1);
    setTimeout(() => {
      setAnswer(null);
      if (round + 1 >= total) onDone(score + (v === question.ratio ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 800);
  };

  return (
    <div>
      <Header title="Contrast Ratio" sub={`Estimate the contrast ratio — ${round + 1}/${total}`} />
      <div style={{
        background: question.bg, padding: 24, borderRadius: 8, marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: question.fg, fontSize: 20, fontWeight: 700 }}>Sample Text</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {question.options.map(o => (
          <button key={o} onClick={() => !answer && check(o)} disabled={!!answer}
            style={{
              ...btnStyle,
              background: answer ? (o === question.ratio ? "#22c55e22" : o === answer ? "#ef444422" : "#ffffff08") : "#ffffff08",
              border: answer && o === question.ratio ? "1px solid #22c55e" : "1px solid #ffffff15",
            }}>
            {o}:1
          </button>
        ))}
      </div>
    </div>
  );
}

function SpacingModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [userVal, setUserVal] = useState(16);
  const [feedback, setFeedback] = useState(null);
  const total = 6;

  const target = useMemo(() => pick([4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]), [round]);

  const check = () => {
    const diff = Math.abs(userVal - target);
    const pass = diff <= 4;
    if (pass) setScore(s => s + 1);
    setFeedback({ pass, actual: target });
    setTimeout(() => {
      setFeedback(null);
      setUserVal(16);
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1000);
  };

  return (
    <div>
      <Header title="Spacing Eye" sub={`Guess the gap between elements — ${round + 1}/${total}`} />
      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 24, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 60, height: 40, background: "#60a5fa", borderRadius: 4 }} />
        <div style={{ width: target, height: 40, position: "relative" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px dashed #ffffff20" }} />
        </div>
        <div style={{ width: 60, height: 40, background: "#a78bfa", borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input type="range" min={0} max={80} value={userVal} onChange={e => setUserVal(+e.target.value)}
          style={{ flex: 1 }} />
        <span style={{ fontFamily: "monospace", fontSize: 14, minWidth: 40 }}>{userVal}px</span>
        {feedback === null ? (
          <button onClick={check} style={btnStyle}>Check</button>
        ) : (
          <span style={{ color: feedback.pass ? "#22c55e" : "#ef4444", fontSize: 13 }}>
            {feedback.pass ? "✓" : `✗ was ${feedback.actual}px`}
          </span>
        )}
      </div>
    </div>
  );
}

function Transform3DModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const total = 6;

  const target = useMemo(() => ({
    rotateX: rand(-45, 45),
    rotateY: rand(-45, 45),
    rotateZ: rand(-30, 30),
  }), [round]);

  const [user, setUser] = useState({ rotateX: 0, rotateY: 0, rotateZ: 0 });
  useEffect(() => { setUser({ rotateX: 0, rotateY: 0, rotateZ: 0 }); setFeedback(null); }, [round]);

  const check = () => {
    const dx = Math.abs(user.rotateX - target.rotateX);
    const dy = Math.abs(user.rotateY - target.rotateY);
    const dz = Math.abs(user.rotateZ - target.rotateZ);
    const pass = dx <= 15 && dy <= 15 && dz <= 15;
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1000);
  };

  const boxStyle = (rx, ry, rz, color) => ({
    width: 80, height: 80, background: color, borderRadius: 6,
    border: "2px solid #ffffff30",
    transform: `perspective(300px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, fontWeight: 700, color: "#ffffff50",
  });

  return (
    <div>
      <Header title="3D Transform" sub={`Match the 3D rotation — ${round + 1}/${total}`} />
      <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 8 }}>Target</div>
          <div style={boxStyle(target.rotateX, target.rotateY, target.rotateZ, "#a78bfa33")}>A</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 8 }}>Yours</div>
          <div style={boxStyle(user.rotateX, user.rotateY, user.rotateZ, "#60a5fa33")}>A</div>
        </div>
      </div>
      {["rotateX", "rotateY", "rotateZ"].map(axis => (
        <div key={axis} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, opacity: 0.5, width: 56, fontFamily: "monospace" }}>{axis}</span>
          <input type="range" min={-60} max={60} value={user[axis]}
            onChange={e => setUser(u => ({ ...u, [axis]: +e.target.value }))} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontFamily: "monospace", width: 40 }}>{user[axis]}°</span>
        </div>
      ))}
      {feedback === null ? (
        <button onClick={check} style={{ ...btnStyle, marginTop: 8 }}>Submit</button>
      ) : (
        <div style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: 8 }}>
          {feedback ? "Nailed it!" : `Off — was (${target.rotateX}°, ${target.rotateY}°, ${target.rotateZ}°)`}
        </div>
      )}
    </div>
  );
}

function PerspectiveModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const total = 6;

  const question = useMemo(() => {
    const perspective = pick([100, 200, 400, 600, 800, 1200]);
    let opts = [perspective];
    while (opts.length < 4) {
      const v = pick([100, 200, 300, 400, 600, 800, 1000, 1200, 1600]);
      if (!opts.includes(v)) opts.push(v);
    }
    return { perspective, options: shuffle(opts) };
  }, [round]);

  const check = (v) => {
    setAnswer(v);
    if (v === question.perspective) setScore(s => s + 1);
    setTimeout(() => {
      setAnswer(null);
      if (round + 1 >= total) onDone(score + (v === question.perspective ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 800);
  };

  return (
    <div>
      <Header title="Perspective" sub={`Identify the perspective value — ${round + 1}/${total}`} />
      <div style={{
        background: "#1a1a2e", borderRadius: 8, padding: 24, marginBottom: 16,
        display: "flex", justifyContent: "center", alignItems: "center", height: 140,
        perspective: question.perspective,
      }}>
        <div style={{
          width: 80, height: 80, background: "linear-gradient(135deg, #a78bfa55, #f472b655)",
          border: "2px solid #ffffff25", borderRadius: 8,
          transform: "rotateY(45deg) rotateX(15deg)",
        }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {question.options.map(o => (
          <button key={o} onClick={() => !answer && check(o)} disabled={!!answer}
            style={{
              ...btnStyle,
              background: answer ? (o === question.perspective ? "#22c55e22" : o === answer ? "#ef444422" : "#ffffff08") : "#ffffff08",
              border: answer && o === question.perspective ? "1px solid #22c55e" : "1px solid #ffffff15",
            }}>
            {o}px
          </button>
        ))}
      </div>
    </div>
  );
}

function ShaderModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const total = 5;

  const challenges = [
    {
      title: "Fix the UV gradient",
      desc: "Complete the fragment shader to show a red-to-blue horizontal gradient",
      template: `void main() {\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  gl_FragColor = vec4(_____, _____, uv.x, 1.0);\n}`,
      answer: ["uv.x", "0.0"],
      check: (c) => c.includes("uv.x") && c.includes("0.0") && c.includes("1.0"),
    },
    {
      title: "Circle SDF",
      desc: "Write the distance function for a circle at center with given radius",
      template: `float circleSDF(vec2 p, vec2 center, float radius) {\n  return _____;\n}`,
      answer: ["length(p - center) - radius"],
      check: (c) => c.includes("length") && c.includes("center") && c.includes("radius"),
    },
    {
      title: "Mix colors",
      desc: "Use mix() to blend colorA and colorB based on uv.x",
      template: `vec3 colorA = vec3(1.0, 0.0, 0.0);\nvec3 colorB = vec3(0.0, 0.0, 1.0);\nvec3 result = _____;`,
      answer: ["mix(colorA, colorB, uv.x)"],
      check: (c) => c.includes("mix") && c.includes("colorA") && c.includes("colorB"),
    },
    {
      title: "Rotate UV",
      desc: "Apply 2D rotation to UV coordinates by angle",
      template: `vec2 rotateUV(vec2 uv, float angle) {\n  float c = cos(angle);\n  float s = sin(angle);\n  return vec2(_____,\n              _____);\n}`,
      answer: ["c*uv.x - s*uv.y", "s*uv.x + c*uv.y"],
      check: (c) => c.includes("cos") && c.includes("sin") && (c.includes("uv.x") || c.includes("uv")),
    },
    {
      title: "Smooth step edge",
      desc: "Create a smooth edge at 0.5 with 0.01 width using smoothstep",
      template: `float edge = _____;`,
      answer: ["smoothstep(0.49, 0.51, uv.x)"],
      check: (c) => c.includes("smoothstep"),
    },
  ];

  const ch = challenges[round % challenges.length];
  useEffect(() => { setCode(ch.template); setFeedback(null); }, [round]);

  const check = () => {
    const pass = ch.check(code);
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1200);
  };

  return (
    <div>
      <Header title="Shader Code" sub={`${ch.title} — ${round + 1}/${total}`} />
      <p style={{ fontSize: 13, opacity: 0.6, margin: "0 0 12px" }}>{ch.desc}</p>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        style={{
          ...inputStyle,
          width: "100%",
          height: 120,
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
          whiteSpace: "pre",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        {feedback === null ? (
          <button onClick={check} style={btnStyle}>Submit</button>
        ) : (
          <span style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {feedback ? "Correct!" : `Expected: ${ch.answer.join(", ")}`}
          </span>
        )}
      </div>
    </div>
  );
}

function UniformsModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const total = 5;
  const canvasRef = useRef(null);

  const target = useMemo(() => ({
    frequency: rand(2, 12),
    amplitude: rand(20, 80) / 100,
    speed: rand(1, 5),
    color: [rand(30, 100) / 100, rand(30, 100) / 100, rand(30, 100) / 100],
  }), [round]);

  const [user, setUser] = useState({ frequency: 5, amplitude: 0.5, speed: 2 });
  useEffect(() => { setUser({ frequency: 5, amplitude: 0.5, speed: 2 }); setFeedback(null); }, [round]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame;
    const W = canvas.width, H = canvas.height;
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, W, H);
      const drawWave = (freq, amp, spd, color, yOff) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x++) {
          const nx = x / W;
          const y = yOff + Math.sin(nx * freq * Math.PI * 2 + t * spd * 0.003) * amp * (H * 0.3);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawWave(target.frequency, target.amplitude, target.speed, `rgba(${target.color.map(c => Math.round(c * 255)).join(",")},0.6)`, H * 0.3);
      drawWave(user.frequency, user.amplitude, user.speed, "#60a5fa", H * 0.7);
      ctx.fillStyle = "#ffffff40";
      ctx.font = "10px monospace";
      ctx.fillText("target", 8, H * 0.3 - 30);
      ctx.fillText("yours", 8, H * 0.7 - 30);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [target, user]);

  const check = () => {
    const df = Math.abs(user.frequency - target.frequency);
    const da = Math.abs(user.amplitude - target.amplitude);
    const ds = Math.abs(user.speed - target.speed);
    const pass = df <= 2 && da <= 0.15 && ds <= 1;
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1000);
  };

  return (
    <div>
      <Header title="Uniform Tuner" sub={`Match the wave pattern — ${round + 1}/${total}`} />
      <canvas ref={canvasRef} width={320} height={200} style={{ borderRadius: 8, width: "100%", maxWidth: 320, display: "block", marginBottom: 12 }} />
      {[
        { key: "frequency", label: "Frequency", min: 1, max: 15, step: 1 },
        { key: "amplitude", label: "Amplitude", min: 0.1, max: 1, step: 0.05 },
        { key: "speed", label: "Speed", min: 1, max: 8, step: 1 },
      ].map(({ key, label, min, max, step }) => (
        <div key={key} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 11, opacity: 0.5, width: 72, fontFamily: "monospace" }}>{label}</span>
          <input type="range" min={min} max={max} step={step} value={user[key]}
            onChange={e => setUser(u => ({ ...u, [key]: +e.target.value }))} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontFamily: "monospace", width: 36 }}>{user[key]}</span>
        </div>
      ))}
      {feedback === null ? (
        <button onClick={check} style={{ ...btnStyle, marginTop: 8 }}>Submit</button>
      ) : (
        <div style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600, marginTop: 8 }}>
          {feedback ? "Matched!" : `Target: freq=${target.frequency}, amp=${target.amplitude}, spd=${target.speed}`}
        </div>
      )}
    </div>
  );
}

function GradientModule({ onDone }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const total = 5;

  const target = useMemo(() => {
    const angle = rand(0, 7) * 45;
    const c1 = { h: rand(0, 360), s: rand(50, 90), l: rand(40, 70) };
    const c2 = { h: (c1.h + rand(40, 180)) % 360, s: rand(50, 90), l: rand(30, 60) };
    return { angle, c1, c2 };
  }, [round]);

  const [user, setUser] = useState({ angle: 90, c1: "#ff0000", c2: "#0000ff" });
  useEffect(() => {
    setUser({ angle: 90, c1: "#ff6666", c2: "#6666ff" });
    setFeedback(null);
  }, [round]);

  const targetGrad = `linear-gradient(${target.angle}deg, hsl(${target.c1.h},${target.c1.s}%,${target.c1.l}%), hsl(${target.c2.h},${target.c2.s}%,${target.c2.l}%))`;
  const userGrad = `linear-gradient(${user.angle}deg, ${user.c1}, ${user.c2})`;

  const check = () => {
    const angleDiff = Math.abs(user.angle - target.angle) % 360;
    const pass = angleDiff <= 45 || angleDiff >= 315;
    if (pass) setScore(s => s + 1);
    setFeedback(pass);
    setTimeout(() => {
      if (round + 1 >= total) onDone(score + (pass ? 1 : 0), total);
      else setRound(r => r + 1);
    }, 1000);
  };

  return (
    <div>
      <Header title="Gradient Build" sub={`Recreate the gradient — ${round + 1}/${total}`} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4 }}>Target</div>
          <div style={{ height: 80, borderRadius: 8, background: targetGrad, border: "1px solid #ffffff15" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 4 }}>Yours</div>
          <div style={{ height: 80, borderRadius: 8, background: userGrad, border: "1px solid #ffffff15" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, opacity: 0.5, width: 48 }}>Angle</span>
        <input type="range" min={0} max={360} step={15} value={user.angle}
          onChange={e => setUser(u => ({ ...u, angle: +e.target.value }))} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontFamily: "monospace", width: 36 }}>{user.angle}°</span>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Color 1</span>
          <input type="color" value={user.c1} onChange={e => setUser(u => ({ ...u, c1: e.target.value }))}
            style={{ width: 32, height: 24, border: "none", background: "none", cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Color 2</span>
          <input type="color" value={user.c2} onChange={e => setUser(u => ({ ...u, c2: e.target.value }))}
            style={{ width: 32, height: 24, border: "none", background: "none", cursor: "pointer" }} />
        </div>
      </div>
      {feedback === null ? (
        <button onClick={check} style={btnStyle}>Submit</button>
      ) : (
        <div style={{ color: feedback ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
          {feedback ? "Good match!" : `Target angle was ${target.angle}°`}
        </div>
      )}
    </div>
  );
}

function Header({ title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <div style={{ fontSize: 12, opacity: 0.4, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const btnStyle = {
  background: "#ffffff08",
  border: "1px solid #ffffff15",
  color: "#ccc",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  transition: "background 0.15s",
};

const inputStyle = {
  background: "#ffffff08",
  border: "1px solid #ffffff15",
  color: "#ccc",
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

const MODULE_MAP = {
  easing: EasingModule,
  timing: TimingModule,
  keyframes: KeyframesModule,
  bezier: BezierModule,
  color: ColorModule,
  contrast: ContrastModule,
  spacing: SpacingModule,
  transform3d: Transform3DModule,
  perspective: PerspectiveModule,
  shader: ShaderModule,
  uniforms: UniformsModule,
  gradient: GradientModule,
};

export default function DesignTrainer() {
  const [view, setView] = useState("menu");
  const [activeModule, setActiveModule] = useState(null);
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({});

  const openModule = (id) => {
    setActiveModule(id);
    setResult(null);
    setView("game");
  };

  const handleDone = (score, total) => {
    setResult({ score, total });
    setStats(s => ({ ...s, [activeModule]: { score, total, ts: Date.now() } }));
    setView("result");
  };

  const filtered = filter === "all" ? MODULES : MODULES.filter(m => m.cat === filter);

  if (view === "result") {
    return (
      <Wrap>
        <Score score={result.score} total={result.total} onBack={() => setView("menu")} />
      </Wrap>
    );
  }

  if (view === "game" && activeModule) {
    const Comp = MODULE_MAP[activeModule];
    return (
      <Wrap>
        <button onClick={() => setView("menu")} style={{ ...btnStyle, marginBottom: 16, padding: "4px 12px", fontSize: 11 }}>← Back</button>
        <Comp onDone={handleDone} />
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" }}>Design Trainer</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.4 }}>Train your eye for animation, 3D, shaders & design</p>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "animation", "design", "3d", "shader"].map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{
              ...btnStyle,
              padding: "4px 12px",
              fontSize: 11,
              background: filter === c ? (CATS[c] || "#ffffff") + "22" : "#ffffff06",
              border: filter === c ? `1px solid ${CATS[c] || "#ffffff55"}` : "1px solid #ffffff10",
              color: filter === c ? (CATS[c] || "#fff") : "#888",
              textTransform: "capitalize",
            }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {filtered.map(m => {
          const s = stats[m.id];
          return (
            <button key={m.id} onClick={() => openModule(m.id)}
              style={{
                background: "#ffffff06",
                border: "1px solid #ffffff10",
                borderRadius: 8,
                padding: 14,
                cursor: "pointer",
                textAlign: "left",
                color: "#ccc",
                fontFamily: "inherit",
                transition: "border-color 0.15s, background 0.15s",
                position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = CATS[m.cat]; e.currentTarget.style.background = "#ffffff0a"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#ffffff10"; e.currentTarget.style.background = "#ffffff06"; }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 10, opacity: 0.35, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.cat}</div>
              {s && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  fontSize: 10, fontWeight: 700,
                  color: s.score / s.total >= 0.7 ? "#22c55e" : "#f59e0b",
                }}>
                  {Math.round(s.score / s.total * 100)}%
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Wrap>
  );
}

function Wrap({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f1a",
      color: "#e0e0e0",
      fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      padding: 24,
      maxWidth: 640,
      margin: "0 auto",
      boxSizing: "border-box",
    }}>
      {children}
    </div>
  );
}
