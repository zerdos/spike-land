import React, { useState, useEffect, useCallback, useRef } from 'react';

const VIBES = [
  { id: "Witty", emoji: "🧠", desc: "Big brain energy" },
  { id: "Deep", emoji: "🌊", desc: "Touch their soul" },
  { id: "Casual", emoji: "😎", desc: "Effortlessly cool" },
  { id: "Bold", emoji: "🔥", desc: "No risk no biscuit" },
  { id: "Unhinged", emoji: "🦝", desc: "Chaos mode" }
];

const DEFAULT_MATCHES = [
  { id: '1', name: 'Alex', bio: 'Loves hiking and sourdough.', status: 'Vibing', notes: 'Ask about the starter recipe. DO NOT mention bread puns yet.', hotness: 4 },
  { id: '2', name: 'Sam', bio: 'Professional dog walker. 6\'2 if that matters.', status: 'Left on Read', notes: 'Mention Pixel. Dogs are the way in.', hotness: 3 },
  { id: '3', name: 'Jordan', bio: 'Looking for someone who can keep up.', status: 'It\'s Complicated', notes: 'Intimidating but probably just into CrossFit.', hotness: 5 }
];

const DEFAULT_JOTS = [
  { id: 'j1', content: "I saw you like sourdough—are we talking basic loaf or are you out here doing cranberry walnut experiments at 3am?", category: 'Icebreaker', timestamp: new Date().toISOString() },
  { id: 'j2', content: "That hiking trail in your 3rd photo looks like it has a better personality than most people I've dated.", category: 'Icebreaker', timestamp: new Date().toISOString() },
  { id: 'j3', content: "Your dog is the main character of your profile and honestly? Respect.", category: 'Bold', timestamp: new Date().toISOString() }
];

const PROMPTS = {
  Witty: [
    "Is your bio a dare? Because I'm definitely taking it and I don't even know the rules.",
    "I'd tell you a joke about sourdough, but it's a bit half-baked. Unlike me. I'm fully baked. Wait—",
    "I'm writing a book on the best first messages. Chapter 1 is just me staring at your profile for 20 minutes.",
    "Your profile said 'looking for adventure' and I once ate gas station sushi, so I think I qualify.",
    "On a scale of 1 to stepping on a Lego, how much would it hurt if I fell for you?"
  ],
  Deep: [
    "What's a hobby you lost touch with that still lives rent-free in your head?",
    "If you could have dinner with any version of yourself—past or future—which one and why?",
    "What's the most underrated emotion? I'll go first: that 4pm Sunday feeling.",
    "If your life had a theme song that played every time you walked into a room, what would it be?",
    "What's something you believe that most people would argue with you about?"
  ],
  Casual: [
    "Hey! That dog in your photo—does he approve of your dates or does he have veto power?",
    "Your vibe is immaculate. What's your coffee order? I feel like it says a lot about a person.",
    "Happy [checks calendar nervously] ...some day of the week! How's it going?",
    "I'm not great at opening lines but I AM great at recommending restaurants. Want proof?",
    "I just spent 10 minutes trying to come up with something smooth so here's the truth: hi, you seem cool."
  ],
  Bold: [
    "I'm usually better at this in person, but my thumbs are doing their best. Give them a chance.",
    "You have main character energy. I'm auditioning for the love interest role.",
    "I'll be honest, your profile was the highlight of my swipe session and I've been swiping since 2019.",
    "Let's skip the 'what do you do' phase and go straight to 'what's your controversial food take.'",
    "I have a theory that we'd have incredible banter. I'm willing to stake my dignity on it."
  ],
  Unhinged: [
    "Do you believe in love at first swipe or should I unmatch and we try this again?",
    "My therapist says I should stop falling for people based on three photos and a Spotify anthem. Anyway, hi.",
    "I showed your profile to my golden retriever and he started wagging. He's never wrong.",
    "I'm not saying I'm the one, but I DID once carry 12 grocery bags in one trip.",
    "Plot twist: I'm actually three raccoons in a trenchcoat. Still interested?",
    "I don't usually message first but my horoscope said to shoot my shot and I'm not about to disrespect the stars."
  ]
};

const COACH_TIPS = [
  { tip: "End every opener with a question. It's 3x more likely to get a response. Science. Probably.", icon: "🎯" },
  { tip: "If they mention a pet, LEAD WITH THE PET. The pet is the decision-maker.", icon: "🐕" },
  { tip: "Double-texting is not a crime. But triple-texting? That's a felony in most states.", icon: "⚖️" },
  { tip: "If their bio says 'fluent in sarcasm,' they're not. But pretend anyway.", icon: "🎭" },
  { tip: "'Haha' = polite. 'Hahaha' = interested. 'HAHAHAHA' = you're in. 'lol' = you're cooked.", icon: "📊" },
  { tip: "Mention something specific from photo #3 or later. It shows you actually looked. Revolutionary.", icon: "🔍" },
  { tip: "The ideal response time is 'slightly longer than they took.' Petty? Yes. Effective? Also yes.", icon: "⏱️" }
];

const KILLERS = [
  { text: '"Hey" — The beige wall of openers', severity: 'fatal' },
  { text: '"How\'s your day?" — Their day was fine. Now it\'s boring.', severity: 'fatal' },
  { text: 'Sending your LinkedIn profile unprompted', severity: 'fatal' },
  { text: 'Talking about your ex in the first 5 messages', severity: 'critical' },
  { text: '"I\'m not like other guys/girls" — You are. That\'s okay.', severity: 'critical' },
  { text: 'Waiting 72+ hours to reply then saying "sorry I was busy"', severity: 'warning' },
  { text: 'Using "u" instead of "you" — we have full keyboards now', severity: 'warning' }
];

const STATUS_COLORS = {
  'Vibing': { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  'Left on Read': { bg: '#fef3c7', text: '#a16207', dot: '#f59e0b' },
  "It's Complicated": { bg: '#f3e8ff', text: '#7c3aed', dot: '#a855f7' },
  'Active': { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  'Ghosted': { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  'Pending': { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' }
};

const STATUSES = ['Vibing', 'Left on Read', "It's Complicated", 'Active', 'Ghosted', 'Pending'];

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
      background: '#1e1b4b', color: '#fff', padding: '10px 20px', borderRadius: 12,
      fontSize: 14, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      display: 'flex', alignItems: 'center', gap: 8, animation: 'slideDown 0.3s ease-out'
    }}>
      <span>✨</span> {message}
    </div>
  );
}

function HotnessMeter({ level = 3, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, cursor: 'pointer' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onChange?.(i)} style={{
          fontSize: 16, filter: i <= level ? 'none' : 'grayscale(1) opacity(0.3)',
          transition: 'all 0.2s', transform: i <= level ? 'scale(1.1)' : 'scale(0.9)'
        }}>🌶️</span>
      ))}
    </div>
  );
}

function StatusBadge({ status, onClick }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS['Active'];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
      transition: 'all 0.2s', letterSpacing: '0.02em', background: s.bg, color: s.text
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'inline-block', background: s.dot }} />
      {status}
    </button>
  );
}

export default function WingmanApp() {
  const [tab, setTab] = useState("roster");
  const [matches, setMatches] = useState(DEFAULT_MATCHES);
  const [jots, setJots] = useState(DEFAULT_JOTS);
  const [newMatch, setNewMatch] = useState({ name: '', bio: '' });
  const [draft, setDraft] = useState('');
  const [vibe, setVibe] = useState('Witty');
  const [toastMsg, setToastMsg] = useState(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const toast = useCallback((msg) => setToastMsg(msg), []);

  const addMatch = () => {
    if (!newMatch.name) { toast("Uhh... they need a name at least 😅"); return; }
    setMatches(prev => [{ ...newMatch, id: Date.now().toString(), status: 'Active', notes: '', hotness: 3 }, ...prev]);
    setNewMatch({ name: '', bio: '' });
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
    toast(`${newMatch.name} added! The game is afoot 🕵️`);
  };

  const cycleStatus = (id) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== id) return m;
      const idx = STATUSES.indexOf(m.status);
      return { ...m, status: STATUSES[(idx + 1) % STATUSES.length] };
    }));
  };

  const updateHotness = (id, h) => setMatches(prev => prev.map(m => m.id === id ? { ...m, hotness: h } : m));
  const updateNotes = (id, notes) => setMatches(prev => prev.map(m => m.id === id ? { ...m, notes } : m));

  const generate = () => {
    setGenerating(true);
    const list = PROMPTS[vibe];
    const msg = list[Math.floor(Math.random() * list.length)];
    let i = 0;
    setDraft('');
    const interval = setInterval(() => {
      setDraft(msg.slice(0, i + 1));
      i++;
      if (i >= msg.length) { clearInterval(interval); setGenerating(false); }
    }, 18);
  };

  const saveJot = (content, cat) => {
    if (!content) return;
    setJots(prev => [{ id: Date.now().toString(), content, category: cat || vibe, timestamp: new Date().toISOString() }, ...prev]);
    toast("Saved to your vault! 📦");
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast("Copied! Now go get 'em 💪"); };
  const tg = (text) => window.open(`https://t.me/share/url?url=${encodeURIComponent(text)}`, '_blank');
  const nextTip = () => setTipIdx(i => (i + 1) % COACH_TIPS.length);

  const tabs = [
    { id: 'roster', label: 'Roster', emoji: '💘' },
    { id: 'draft', label: 'Draft', emoji: '✍️' },
    { id: 'jots', label: 'Jots', emoji: '📋' },
    { id: 'coach', label: 'Coach', emoji: '🧙' }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wr {
          font-family: 'Bricolage Grotesque', sans-serif;
          min-height: 100vh;
          background: #fef7f0;
          color: #1a1a2e;
          position: relative;
          overflow-x: hidden;
        }
        .wr::before {
          content: '';
          position: fixed; top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(251,113,133,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .wr::after {
          content: '';
          position: fixed; bottom: -150px; left: -150px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .mono { font-family: 'DM Mono', monospace; }
        .tab-b {
          padding: 10px 16px; border: 2px solid transparent; background: transparent;
          border-radius: 14px; cursor: pointer; font-family: inherit; font-weight: 600;
          font-size: 14px; color: #64748b; transition: all 0.25s; display: flex;
          align-items: center; gap: 6px;
        }
        .tab-b:hover { background: #fff; color: #1a1a2e; }
        .tab-b.on { background: #1a1a2e; color: #fff; border-color: #1a1a2e; box-shadow: 0 4px 16px rgba(26,26,46,0.15); }
        .cd {
          background: #fff; border-radius: 20px; border: 1.5px solid #f0e8e0;
          overflow: hidden; transition: all 0.3s;
        }
        .cd:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.06); border-color: #e8ddd4; }
        .cd-g { background: linear-gradient(135deg, #fb7185 0%, #f59e0b 50%, #fb923c 100%); border: none; color: white; }
        .bp {
          background: #fb7185; color: white; border: none; padding: 10px 20px;
          border-radius: 12px; font-family: inherit; font-weight: 600; font-size: 14px;
          cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
        }
        .bp:hover { background: #e11d48; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(251,113,133,0.3); }
        .bp:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
        .bs {
          background: #f8f4f0; color: #1a1a2e; border: 1.5px solid #e8ddd4;
          padding: 10px 20px; border-radius: 12px; font-family: inherit; font-weight: 600;
          font-size: 14px; cursor: pointer; transition: all 0.2s; display: inline-flex;
          align-items: center; gap: 8px;
        }
        .bs:hover { background: #1a1a2e; color: #fff; }
        .bs:disabled { opacity: 0.4; cursor: not-allowed; }
        .bg {
          background: none; border: none; padding: 8px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center;
          justify-content: center; font-size: 16px;
        }
        .bg:hover { background: #f8f4f0; transform: scale(1.1); }
        .inf {
          width: 100%; padding: 10px 14px; border: 1.5px solid #e8ddd4;
          border-radius: 12px; font-family: inherit; font-size: 14px;
          background: #fefcfa; transition: all 0.2s; outline: none; color: #1a1a2e;
        }
        .inf:focus { border-color: #fb7185; box-shadow: 0 0 0 3px rgba(251,113,133,0.1); }
        .inf::placeholder { color: #b0a89e; }
        textarea.inf { resize: none; min-height: 60px; line-height: 1.5; }
        .vc {
          padding: 8px 16px; border-radius: 24px; border: 2px solid #e8ddd4;
          background: white; cursor: pointer; font-family: inherit; font-weight: 600;
          font-size: 13px; transition: all 0.25s; display: flex; align-items: center;
          gap: 6px; color: #64748b; white-space: nowrap;
        }
        .vc:hover { border-color: #fb7185; color: #e11d48; transform: translateY(-2px); }
        .vc.on { background: #1a1a2e; border-color: #1a1a2e; color: #fff; box-shadow: 0 4px 12px rgba(26,26,46,0.2); }
        .ma {
          width: 48px; height: 48px; border-radius: 16px; display: flex;
          align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; font-weight: 700;
        }
        .jc {
          background: #fff; border: 1.5px solid #f0e8e0; border-radius: 16px;
          padding: 20px; transition: all 0.3s; position: relative;
        }
        .jc:hover { border-color: #fb7185; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .ni {
          width: 100%; padding: 8px 12px; border: 1px dashed #d4ccc4;
          border-radius: 8px; font-size: 13px; font-style: italic;
          background: #fefcfa; font-family: inherit; color: #64748b; outline: none; transition: all 0.2s;
        }
        .ni:focus { border-style: solid; border-color: #fb7185; color: #1a1a2e; }
        .da { min-height: 140px; font-size: 16px; line-height: 1.6; border: 2px solid #e8ddd4; border-radius: 16px; padding: 16px; background: #fffcf9; }
        .da:focus { border-color: #fb7185; box-shadow: 0 0 0 4px rgba(251,113,133,0.08); }
        .ki { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f5f0eb; font-size: 14px; }
        .ki:last-child { border-bottom: none; }
        .sf { color: #e11d48; } .sc { color: #f59e0b; } .sw { color: #64748b; }
        .es {
          height: 200px; display: flex; flex-direction: column; align-items: center;
          justify-content: center; border: 2px dashed #e8ddd4; border-radius: 20px;
          color: #b0a89e; gap: 8px; font-size: 14px;
        }
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes floatUp {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-20vh) rotate(720deg); opacity: 0; }
        }
        .cp { position: absolute; bottom: 0; animation: floatUp 2s ease-out forwards; font-size: 24px; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,113,133,0.2); }
          50% { box-shadow: 0 0 0 8px rgba(251,113,133,0); }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .tc { display: inline-block; width: 2px; height: 1.1em; background: #fb7185; margin-left: 2px; vertical-align: text-bottom; animation: blink 0.8s infinite; }
      `}</style>

      <div className="wr">
        {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {confetti && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
            {['💘','🎉','✨','❤️','🔥','💫','🎊','💝'].map((e, i) => (
              <span key={i} className="cp" style={{
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`
              }}>{e}</span>
            ))}
          </div>
        )}

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px 80px' }}>

          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 36 }}>💘</span> Wingman AI
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Because "hey" is not a personality.</p>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              padding: '6px 14px', borderRadius: 24, fontSize: 12, fontWeight: 700
            }}>
              ⚡ Rizz Level: <span className="mono" style={{ color: '#d97706' }}>EXPERT</span>
            </div>
          </header>

          <nav style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab-b ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </nav>

          {/* === ROSTER === */}
          {tab === 'roster' && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div className="cd" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🆕</span>
                  <h2 style={{ fontWeight: 700, fontSize: 18 }}>Fresh Match</h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Someone caught your eye? Don't let them escape into the void.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <input className="inf" placeholder="Their name (or codename)" value={newMatch.name}
                    onChange={e => setNewMatch(p => ({ ...p, name: e.target.value }))}
                    style={{ flex: '1 1 160px' }} onKeyDown={e => e.key === 'Enter' && addMatch()} />
                  <input className="inf" placeholder="Bio highlights, red flags, vibes..." value={newMatch.bio}
                    onChange={e => setNewMatch(p => ({ ...p, bio: e.target.value }))}
                    style={{ flex: '2 1 240px' }} onKeyDown={e => e.key === 'Enter' && addMatch()} />
                  <button className="bp" onClick={addMatch}><span>+</span> Add to Roster</button>
                </div>
              </div>

              {matches.length === 0 ? (
                <div className="es">
                  <span style={{ fontSize: 40 }}>🏜️</span>
                  <p style={{ fontWeight: 600 }}>Your roster is empty</p>
                  <p>Time to swipe like your Wi-Fi depends on it.</p>
                </div>
              ) : matches.map(m => (
                <div className="cd" key={m.id} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div className="ma" style={{
                      background: `hsl(${m.name.charCodeAt(0) * 7 % 360}, 80%, 92%)`,
                      color: `hsl(${m.name.charCodeAt(0) * 7 % 360}, 60%, 40%)`
                    }}>{m.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h3 style={{ fontWeight: 700, fontSize: 18 }}>{m.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <HotnessMeter level={m.hotness} onChange={h => updateHotness(m.id, h)} />
                          <StatusBadge status={m.status} onClick={() => cycleStatus(m.id)} />
                        </div>
                      </div>
                      {m.bio && <p style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>"{m.bio}"</p>}
                      <input className="ni" placeholder="Secret notes, strategies, inside jokes..."
                        value={m.notes} onChange={e => updateNotes(m.id, e.target.value)} />
                    </div>
                    <button className="bg" onClick={() => setMatches(prev => prev.filter(x => x.id !== m.id))}
                      style={{ color: '#cbd5e1' }} title="Remove">🗑️</button>
                  </div>
                </div>
              ))}

              {matches.length > 0 && (
                <p className="mono" style={{ textAlign: 'center', fontSize: 12, color: '#b0a89e' }}>
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} in rotation • Click status to cycle • 🌶️ = spice level
                </p>
              )}
            </div>
          )}

          {/* === DRAFT === */}
          {tab === 'draft' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="cd" style={{ padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧪 Message Lab</h2>
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>Craft the perfect opener. No pressure. (Okay, a little pressure.)</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {VIBES.map(v => (
                    <button key={v.id} className={`vc ${vibe === v.id ? 'on' : ''}`}
                      onClick={() => setVibe(v.id)} title={v.desc}>
                      <span>{v.emoji}</span> {v.id}
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <textarea className="inf da"
                    placeholder="Type your masterpiece here or hit ✨ Magic Suggest and let chaos do the work..."
                    value={draft} onChange={e => setDraft(e.target.value)} />
                  {generating && <span className="tc" />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div className="mono" style={{ fontSize: 12, color: '#b0a89e' }}>
                    {draft.length} chars • vibe: {vibe.toLowerCase()} {VIBES.find(v => v.id === vibe)?.emoji}
                  </div>
                  <button className="bp" onClick={generate} disabled={generating}
                    style={generating ? { background: '#94a3b8' } : { animation: 'pulse-glow 2s infinite' }}>
                    {generating ? '🔮 Channeling...' : '✨ Magic Suggest'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="bs" onClick={() => { saveJot(draft); setDraft(''); }} disabled={!draft}>📦 Save to Jots</button>
                <button className="bs" onClick={() => copy(draft)} disabled={!draft}>📋 Copy</button>
                <button className="bp" onClick={() => tg(draft)} disabled={!draft}
                  style={{ background: '#38bdf8', marginLeft: 'auto' }}>✈️ Send to Telegram</button>
              </div>
              <div className="cd" style={{ padding: 20, background: '#fffbf0', borderColor: '#f5e6c8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.05em', marginBottom: 6 }}>
                      {COACH_TIPS[tipIdx].icon} Coach Tip #{tipIdx + 1}
                    </div>
                    <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.5 }}>{COACH_TIPS[tipIdx].tip}</p>
                  </div>
                  <button className="bg" onClick={nextTip} style={{ fontSize: 20 }} title="Next tip">🔄</button>
                </div>
              </div>
            </div>
          )}

          {/* === JOTS === */}
          {tab === 'jots' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 22 }}>📋 The Vault</h2>
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>Your greatest hits. Copy, send, or cringe at past you.</p>
                </div>
                <span className="mono" style={{ fontSize: 12, color: '#b0a89e' }}>{jots.length} saved</span>
              </div>
              {jots.length === 0 ? (
                <div className="es">
                  <span style={{ fontSize: 40 }}>📭</span>
                  <p style={{ fontWeight: 600 }}>The vault is empty</p>
                  <p>Go draft something legendary in the Message Lab.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {jots.map(j => (
                    <div className="jc" key={j.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ background: '#f5f0eb', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#78716c' }}>{j.category}</span>
                        <span className="mono" style={{ fontSize: 10, color: '#b0a89e' }}>{new Date(j.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#374151', fontStyle: 'italic', marginBottom: 16 }}>"{j.content}"</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="bg" onClick={() => copy(j.content)} title="Copy">📋</button>
                        <button className="bg" onClick={() => tg(j.content)} title="Telegram">✈️</button>
                        <button className="bg" onClick={() => { setDraft(j.content); setTab('draft'); }} title="Edit">✏️</button>
                        <button className="bg" onClick={() => setJots(prev => prev.filter(x => x.id !== j.id))} title="Delete" style={{ color: '#fca5a5' }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === COACH === */}
          {tab === 'coach' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="cd cd-g" style={{ padding: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 12 }}>🧙 Daily Wisdom</div>
                <p style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>
                  "Quality over quantity. Send 3 messages that make them think vs 20 that make them yawn."
                </p>
                <p style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>— Your AI Wingman, who has never been on a date but has processed millions of them</p>
              </div>

              <div className="cd" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>🔍 Profile Audit Checklist</h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  {[
                    { t: "Photo 1: The Hook", a: "Eyes visible. No sunglasses. No group photos where we have to guess. We don't have time for Where's Waldo.", e: "📸" },
                    { t: "Photo 3: The Personality", a: "Show a hobby, a pet, or a place you love. Bathroom selfies are where conversations go to die.", e: "🎨" },
                    { t: "The Bio: The Filter", a: "Include one spicy opinion ('Pineapple belongs on pizza'). Controversy breeds conversation. Be the pineapple.", e: "🍕" },
                    { t: "The Anthem", a: "Your Spotify anthem says more about you than your bio. Choose wisely. No, 'Mr. Brightside' doesn't count anymore.", e: "🎵" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 24, marginTop: 2 }}>{item.e}</span>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>{item.t}</p>
                        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cd" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>☠️ Conversation Killers</h3>
                <div>
                  {KILLERS.map((k, i) => (
                    <div className="ki" key={i}>
                      <span style={{ fontSize: 18 }}>{k.severity === 'fatal' ? '💀' : k.severity === 'critical' ? '⚠️' : '😬'}</span>
                      <span className={k.severity === 'fatal' ? 'sf' : k.severity === 'critical' ? 'sc' : 'sw'}>{k.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cd" style={{ padding: 24, background: '#f0f9ff', borderColor: '#bae6fd' }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>📊 The "Haha" Decoder Ring</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { r: 'lol', m: 'They are NOT laughing.', l: '🔴' },
                    { r: 'haha', m: "Polite acknowledgment. You're on thin ice.", l: '🟡' },
                    { r: 'hahaha', m: 'Genuine amusement. Keep going!', l: '🟢' },
                    { r: 'HAHAHAHA', m: "You have their full attention. Don't blow it.", l: '💚' },
                    { r: '😂😂😂', m: "They showed their friend. You're basically famous.", l: '⭐' },
                    { r: '💀', m: 'You killed them. Marry them immediately.', l: '👑' },
                  ].map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 5 ? '1px solid #e0f2fe' : 'none' }}>
                      <span>{h.l}</span>
                      <span className="mono" style={{ fontWeight: 700, minWidth: 100, fontSize: 14 }}>{h.r}</span>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{h.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cd" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>✈️ Telegram Workflow</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    "Draft your masterpiece in the ✍️ Draft tab.",
                    "Hit 'Send to Telegram' — it opens the app directly.",
                    "Paste to your match's chat or 'Saved Messages' for later.",
                    "Keep your dating ops organized. You're running a business here."
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#1a1a2e', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0
                      }}>{i + 1}</span>
                      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <footer style={{ marginTop: 64, textAlign: 'center', color: '#b0a89e', fontSize: 12, paddingBottom: 24 }}>
            <p>💘 Wingman AI • Built for better connections (and worse puns)</p>
            <p className="mono" style={{ fontSize: 10, marginTop: 4 }}>side effects may include: confidence, overthinking, and unsolicited advice from an AI</p>
          </footer>
        </div>
      </div>
    </>
  );
}
