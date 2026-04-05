import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  RotateCcw,
  Moon,
  Sun,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const THEMES = {
  light: {
    bg: '#f8fafc', bgGradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
    face: '#ffffff', text: '#0f172a', border: '#cbd5e1', muted: '#64748b',
    cardBg: '#ffffff', cardBorder: '#e2e8f0', surfaceBg: '#f1f5f9',
    glow: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    bg: '#020617', bgGradient: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #0f172a 100%)',
    face: '#0f172a', text: '#f1f5f9', border: '#334155', muted: '#94a3b8',
    cardBg: '#0f172a', cardBorder: '#1e293b', surfaceBg: '#1e293b',
    glow: 'rgba(248, 250, 252, 0.05)',
  },
  midnight: {
    bg: '#020830', bgGradient: 'linear-gradient(135deg, #0c1445 0%, #020830 50%, #0a1035 100%)',
    face: '#060e2e', text: '#38bdf8', border: '#1e3a5f', muted: '#7dd3fc',
    cardBg: '#0c1445', cardBorder: '#1e3a5f', surfaceBg: '#0f1b54',
    glow: 'rgba(56, 189, 248, 0.08)',
  },
  gold: {
    bg: '#1c1917', bgGradient: 'linear-gradient(135deg, #292524 0%, #1c1917 50%, #231f1e 100%)',
    face: '#1c1917', text: '#fbbf24', border: '#44403c', muted: '#d6d3d1',
    cardBg: '#292524', cardBorder: '#44403c', surfaceBg: '#33302e',
    glow: 'rgba(251, 191, 36, 0.08)',
  },
};

const FACE_STYLES = ['minimal', 'numeric', 'roman', 'dots'];

const ACCENTS = [
  { color: '#3b82f6', name: 'Blue' },
  { color: '#ef4444', name: 'Red' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#f97316', name: 'Orange' },
];

export default function AnalogWatchApp() {
  const [config, setConfig] = useState({
    theme: 'dark', face: 'numeric', accent: '#3b82f6',
    showSeconds: true, sweep: false, showDate: true,
  });
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), config.sweep ? 50 : 1000);
    return () => clearInterval(timer);
  }, [config.sweep]);

  const seconds = time.getSeconds() + (config.sweep ? time.getMilliseconds() / 1000 : 0);
  const minutes = time.getMinutes() + seconds / 60;
  const hours = (time.getHours() % 12) + minutes / 60;
  const rot = (val, max) => (val / max) * 360;

  const t = THEMES[config.theme] || THEMES.dark;
  const isLight = config.theme === 'light';

  const reset = useCallback(() => setConfig({
    theme: 'dark', face: 'numeric', accent: '#3b82f6',
    showSeconds: true, sweep: false, showDate: true,
  }), []);

  const WatchFace = () => {
    const hourAngle = rot(hours, 12);
    const minuteAngle = rot(minutes, 60);
    const secondAngle = rot(seconds, 60);
    const springTransition = 'transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)';

    const markers = Array.from({ length: 60 }).map((_, i) => {
      const isHour = i % 5 === 0;
      return (
        <line key={i}
          x1="50" y1={isHour ? "5.5" : "7.5"} x2="50" y2={isHour ? "11" : "9.5"}
          transform={`rotate(${i * 6} 50 50)`}
          stroke={isHour ? t.text : `${t.text}33`}
          strokeWidth={isHour ? "1.4" : "0.4"}
          strokeLinecap="round"
        />
      );
    });

    const renderNumbers = () => {
      if (config.face === 'minimal') return null;
      if (config.face === 'dots') {
        return Array.from({ length: 12 }).map((_, i) => {
          const n = i === 0 ? 12 : i;
          const major = [12, 3, 6, 9].includes(n);
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <circle key={n}
              cx={50 + 35 * Math.sin(angle)} cy={50 - 35 * Math.cos(angle)}
              r={major ? "1.8" : "0.8"} fill={major ? config.accent : `${t.text}66`}
            />
          );
        });
      }
      const labels = config.face === 'roman'
        ? ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI']
        : ['12','1','2','3','4','5','6','7','8','9','10','11'];
      return labels.map((label, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return (
          <text key={label}
            x={50 + 36 * Math.sin(angle)} y={50 - 36 * Math.cos(angle)}
            fill={t.text} fontSize={config.face === 'roman' ? "4" : "5.5"}
            fontWeight="600" textAnchor="middle" dominantBaseline="middle"
            style={{ userSelect: 'none', fontFamily: 'system-ui, sans-serif' }}
          >{label}</text>
        );
      });
    };

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1', margin: '0 auto' }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: '50%',
          background: `radial-gradient(circle, ${config.accent}15 0%, transparent 70%)`,
          filter: 'blur(24px)', pointerEvents: 'none',
        }} />
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
          <defs>
            <radialGradient id="faceGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor={isLight ? '#ffffff' : `${t.text}08`} />
              <stop offset="100%" stopColor={t.face} />
            </radialGradient>
            <filter id="caseShadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Case */}
          <circle cx="50" cy="50" r="49" fill={`${t.border}44`} filter="url(#caseShadow)" />
          <circle cx="50" cy="50" r="48" fill={t.border} />
          <circle cx="50" cy="50" r="47" fill={t.face} stroke={`${t.text}11`} strokeWidth="0.3" />
          <circle cx="50" cy="50" r="46" fill="url(#faceGrad)" />
          <circle cx="50" cy="50" r="43" fill="none" stroke={`${t.text}08`} strokeWidth="0.3" />

          {markers}
          {renderNumbers()}

          {/* Date Window */}
          {config.showDate && (
            <g>
              <rect x="64.5" y="46" width="13" height="8" rx="1.5"
                fill={t.face} stroke={`${t.text}22`} strokeWidth="0.4" />
              <text x="71" y="50.5" fill={config.accent} fontSize="4.5" fontWeight="bold"
                textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {time.getDate()}
              </text>
            </g>
          )}

          {/* Brand */}
          <text x="50" y="28" fill={t.text} opacity="0.15" fontSize="2.8" textAnchor="middle"
            fontWeight="bold" letterSpacing="1.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
            PRECISION
          </text>
          <text x="50" y="31.5" fill={t.text} opacity="0.1" fontSize="1.8" textAnchor="middle"
            letterSpacing="0.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
            AUTOMATIC
          </text>

          {/* Hour Hand (tapered) */}
          <polygon points="48.8,28 50,22 51.2,28 51,50 49,50" fill={t.text}
            transform={`rotate(${hourAngle} 50 50)`}
            style={{ transition: config.sweep ? 'none' : springTransition }} />

          {/* Minute Hand (tapered) */}
          <polygon points="49.2,20 50,13 50.8,20 50.6,50 49.4,50" fill={t.text}
            transform={`rotate(${minuteAngle} 50 50)`}
            style={{ transition: config.sweep ? 'none' : springTransition }} />

          {/* Second Hand */}
          {config.showSeconds && (
            <g transform={`rotate(${secondAngle} 50 50)`}
              style={{ transition: config.sweep ? 'none' : 'transform 0.15s cubic-bezier(0.4, 2.08, 0.55, 0.44)' }}>
              <line x1="50" y1="58" x2="50" y2="12" stroke={config.accent} strokeWidth="0.6" strokeLinecap="round" />
              <circle cx="50" cy="58" r="1.2" fill={config.accent} />
              <circle cx="50" cy="50" r="2" fill={config.accent} />
              <circle cx="50" cy="50" r="0.8" fill={isLight ? '#fff' : '#0f172a'} />
            </g>
          )}

          {/* Center cap (no seconds) */}
          {!config.showSeconds && (
            <>
              <circle cx="50" cy="50" r="1.8" fill={t.text} />
              <circle cx="50" cy="50" r="0.6" fill={t.face} />
            </>
          )}
        </svg>
      </div>
    );
  };

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh', width: '100%', padding: 20,
      background: t.bgGradient, transition: 'background 0.5s ease',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @media (min-width: 880px) { .watch-layout { grid-template-columns: 7fr 5fr !important; } }
        .switch-row:hover { background: ${t.text}0a; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${config.accent}, ${config.accent}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${config.accent}33`,
            }}>
              <Clock size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0, letterSpacing: -0.5 }}>
                Horology Studio
              </h1>
              <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>Precision digital timepieces</p>
            </div>
          </div>
          <div style={{
            padding: '5px 12px', borderRadius: 8,
            background: `${t.text}08`, border: `1px solid ${t.text}10`,
            color: t.muted, fontSize: 12, fontWeight: 500,
          }}>
            {dateStr}
          </div>
        </div>

        {/* Main Grid */}
        <div className="watch-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, alignItems: 'start' }}>

          {/* Watch Column */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            padding: '36px 20px 28px',
            background: `${t.text}03`, borderRadius: 20,
            border: `1px solid ${t.text}08`,
          }}>
            <WatchFace />

            {/* Digital readout */}
            <div style={{
              fontSize: 26, fontWeight: 300, color: t.text,
              letterSpacing: 3, fontVariantNumeric: 'tabular-nums',
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              opacity: 0.85,
            }}>
              {timeStr}
            </div>

            {/* Theme quick-switch bar */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {Object.keys(THEMES).map(name => (
                <button key={name}
                  onClick={() => setConfig(prev => ({ ...prev, theme: name }))}
                  title={name.charAt(0).toUpperCase() + name.slice(1)}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: config.theme === name
                      ? `linear-gradient(135deg, ${config.accent}, ${config.accent}aa)` : `${t.text}0c`,
                    color: config.theme === name ? '#fff' : t.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    outline: config.theme === name ? `2px solid ${config.accent}44` : 'none',
                    outlineOffset: 2,
                  }}>
                  {name === 'light' ? <Sun size={14}/> : name === 'dark' ? <Moon size={14}/> :
                   name === 'midnight' ? <Sparkles size={14}/> : <span style={{fontSize:13}}>✦</span>}
                </button>
              ))}
              <div style={{ width: 1, height: 20, background: `${t.text}15`, margin: '0 4px' }} />
              <button onClick={reset} title="Reset"
                style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: `${t.text}0c`, color: t.muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Controls Column */}
          <div style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: `0 8px 32px ${t.glow}`,
          }}>
            <div style={{
              padding: '18px 22px', borderBottom: `1px solid ${t.cardBorder}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Settings size={16} color={t.muted} />
              <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Configuration</span>
            </div>

            <div style={{ padding: '18px 22px' }}>
              <Tabs defaultValue="style" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-5">
                  <TabsTrigger value="style">Appearance</TabsTrigger>
                  <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
                </TabsList>

                <TabsContent value="style" className="space-y-5">
                  {/* Face Style */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>Watch Face</Label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {FACE_STYLES.map(style => (
                        <button key={style}
                          onClick={() => setConfig(prev => ({ ...prev, face: style }))}
                          style={{
                            padding: '7px 2px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                            transition: 'all 0.15s',
                            background: config.face === style
                              ? `linear-gradient(135deg, ${config.accent}, ${config.accent}cc)` : `${t.text}08`,
                            color: config.face === style ? '#fff' : t.muted,
                            outline: config.face === style ? `2px solid ${config.accent}33` : `1px solid ${t.text}0a`,
                            outlineOffset: config.face === style ? 2 : 0,
                          }}>
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>Accent Color</Label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ACCENTS.map(({ color, name }) => (
                        <button key={color}
                          onClick={() => setConfig(prev => ({ ...prev, accent: color }))}
                          title={name}
                          style={{
                            width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: color, position: 'relative',
                            outline: config.accent === color ? `2px solid ${color}` : '2px solid transparent',
                            outlineOffset: 3, transition: 'all 0.15s',
                            transform: config.accent === color ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: config.accent === color ? `0 0 12px ${color}44` : 'none',
                          }}>
                          {config.accent === color && (
                            <span style={{
                              position: 'absolute', inset: 0, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 13, fontWeight: 700,
                            }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>Theme</Label>
                    <Select value={config.theme}
                      onValueChange={(v) => setConfig(prev => ({ ...prev, theme: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Classic Light</SelectItem>
                        <SelectItem value="dark">🌑 Obsidian Dark</SelectItem>
                        <SelectItem value="midnight">🌌 Deep Midnight</SelectItem>
                        <SelectItem value="gold">👑 Royal Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="mechanics" className="space-y-3">
                  {[
                    { key: 'sweep', label: 'Sweep Seconds', desc: 'Smooth Spring Drive–style movement' },
                    { key: 'showSeconds', label: 'Seconds Hand', desc: 'Toggle second hand visibility' },
                    { key: 'showDate', label: 'Date Window', desc: 'Day of month at 3 o\'clock position' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="switch-row" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      border: `1px solid ${t.text}08`, transition: 'background 0.15s',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{label}</div>
                        <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{desc}</div>
                      </div>
                      <Switch checked={config[key]}
                        onCheckedChange={(v) => setConfig(prev => ({ ...prev, [key]: v }))} />
                    </div>
                  ))}

                  <div style={{
                    padding: 14, borderRadius: 10, marginTop: 8,
                    background: `${config.accent}0c`, border: `1px solid ${config.accent}18`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <Info size={14} color={config.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.6 }}>
                      Sweep mode runs at 20fps for fluid motion similar to high-end mechanical calibers. 
                      Tick mode uses a spring-bounce easing for satisfying quartz-style precision.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
