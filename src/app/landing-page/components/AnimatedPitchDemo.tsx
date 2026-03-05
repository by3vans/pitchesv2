'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PitchCard {
  initials: string;
  gradient: string;
  name: string;
  status: string;
  statusColor: string;
  statusBg: string;
  title: string;
  label: string;
  date: string;
}

// ─── Animation phases ────────────────────────────────────────────────────────

const EXISTING_CARDS: PitchCard[] = [
  {
    initials: 'MJ', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    name: 'Marcus James', status: 'Approved', statusColor: '#166534', statusBg: '#dcfce7',
    title: 'Summer Anthem', label: 'Universal Music', date: '01/03/2026',
  },
  {
    initials: 'SR', gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)',
    name: 'Sofia Ramos', status: 'In Review', statusColor: '#92400e', statusBg: '#fef3c7',
    title: 'Wildflower EP', label: 'Sony Music', date: '18/02/2026',
  },
  {
    initials: 'DK', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    name: 'DJ Kuro', status: 'New', statusColor: '#1e40af', statusBg: '#dbeafe',
    title: 'City Lights', label: 'Warner Records', date: '01/02/2026',
  },
];

const NEW_CARD: PitchCard = {
  initials: 'MJ', gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
  name: 'Marcus James', status: 'Sent', statusColor: '#1e40af', statusBg: '#dbeafe',
  title: 'Summer Anthem 2026', label: 'Universal Music', date: '05/03/2026',
};

const FORM_FIELDS = [
  { key: 'artist', label: 'Artist Name', value: 'Marcus James' },
  { key: 'song', label: 'Song Title', value: 'Summer Anthem 2026' },
  { key: 'label', label: 'Label', value: 'Universal Music' },
  { key: 'anr', label: 'A&R Contact', value: 'Jordan Ellis' },
  { key: 'notes', label: 'Notes', value: 'Strong R&B single, perfect for Q3 playlist push' },
];

function useTypingAnimation(
  text: string,
  active: boolean,
  speed = 80,
  onDone?: () => void
) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cursorOn, setCursorOn] = useState(true);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      setShowCursor(false);
      indexRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
      return;
    }

    setShowCursor(true);
    setCursorOn(true);
    cursorRef.current = setInterval(() => setCursorOn(c => !c), 530);

    function typeNext() {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayed(text.slice(0, indexRef.current));
        timerRef.current = setTimeout(typeNext, speed + Math.random() * 30);
      } else {
        if (cursorRef.current) clearInterval(cursorRef.current);
        setShowCursor(false);
        onDoneRef.current?.();
      }
    }

    timerRef.current = setTimeout(typeNext, 120);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
  }, [active, text, speed]);

  return { displayed, showCursor, cursorOn };
}

// ─── Pitch Card ───────────────────────────────────────────────────────────────

function PitchCardItem({ card, highlight = false, compact = false }: { card: PitchCard; highlight?: boolean; compact?: boolean }) {
  return (
    <div style={{
      background: highlight ? '#eff6ff' : '#fff',
      border: `1.5px solid ${highlight ? '#93c5fd' : '#e5e7eb'}`,
      borderRadius: compact ? 8 : 10,
      padding: compact ? '8px 10px' : '12px 14px',
      transition: 'all 0.5s ease',
      boxShadow: highlight ? '0 0 0 3px rgba(29,78,216,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 8, marginBottom: compact ? 4 : 6 }}>
        <div style={{
          width: compact ? 24 : 30, height: compact ? 24 : 30, borderRadius: '50%',
          background: card.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? '0.55rem' : '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{card.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? '0.6rem' : '0.65rem', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
          <span style={{
            display: 'inline-block', fontSize: compact ? '0.55rem' : '0.6rem', fontWeight: 600,
            color: card.statusColor, background: card.statusBg,
            borderRadius: 20, padding: '1px 6px', marginTop: 1,
          }}>{card.status}</span>
        </div>
      </div>
      <div style={{ fontSize: compact ? '0.6rem' : '0.65rem', fontWeight: 600, color: '#111', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</div>
      <div style={{ fontSize: compact ? '0.55rem' : '0.6rem', color: '#6b7280', marginBottom: 2 }}>{card.label}</div>
      <div style={{ fontSize: compact ? '0.5rem' : '0.55rem', color: '#9ca3af' }}>{card.date}</div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <div className="demo-sidebar" style={{
      width: 150, flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', padding: '14px 0',
      fontSize: '0.7rem',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 14px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: '#1d4ed8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 900, color: '#fff',
          }}>P</div>
          <span style={{ fontWeight: 700, color: '#111', fontSize: '0.7rem' }}>Pitchhood</span>
        </div>
      </div>

      {/* Nav items */}
      {[{ label: 'Dashboard', icon: '⊞' }, { label: 'Pitches', icon: '◈', active: true }, { label: 'Artists', icon: '♪' }, { label: 'Contacts', icon: '◎' }].map(item => (
        <div key={item.label} style={{
          padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
          background: item.active ? '#eff6ff' : 'transparent',
          color: item.active ? '#1d4ed8' : '#6b7280',
          fontWeight: item.active ? 600 : 400,
          borderLeft: item.active ? '2px solid #1d4ed8' : '2px solid transparent',
          cursor: 'default',
        }}>
          <span style={{ fontSize: '0.7rem' }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      <div style={{ padding: '10px 14px 4px', fontSize: '0.5rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>WORKFLOW</div>
      {[{ label: 'Activity', icon: '◷' }, { label: 'Reminders', icon: '🔔' }, { label: 'Templates', icon: '▤' }].map(item => (
        <div key={item.label} style={{
          padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7,
          color: '#6b7280', cursor: 'default',
        }}>
          <span style={{ fontSize: '0.7rem' }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Demo Component ──────────────────────────────────────────────────────

export default function AnimatedPitchDemo() {
  const [phase, setPhase] = useState(0);
  const [btnPulse, setBtnPulse] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSelected, setStatusSelected] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardHighlight, setNewCardHighlight] = useState(false);
  const [totalPitches, setTotalPitches] = useState(3);
  const [isMobile, setIsMobile] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Separate timer refs to avoid nested setTimeout cleanup issues
  const timerARef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const reset = useCallback(() => {
    setPhase(0);
    setBtnPulse(false);
    setModalOpen(false);
    setActiveField(null);
    setFieldValues({});
    setStatusOpen(false);
    setStatusSelected(false);
    setSavePulse(false);
    setShowCheck(false);
    setShowNewCard(false);
    setNewCardHighlight(false);
    setTotalPitches(3);
  }, []);

  // Stable fieldOrder derived once
  const fieldOrder = useMemo(() => FORM_FIELDS.map(f => f.key), []);

  const [currentFieldIdx, setCurrentFieldIdx] = useState(0);
  const currentField = fieldOrder[currentFieldIdx];
  const currentFieldData = FORM_FIELDS[currentFieldIdx];

  const { displayed, showCursor, cursorOn } = useTypingAnimation(
    phase === 3 && currentFieldData ? currentFieldData.value : '',
    phase === 3 && activeField === currentField,
    80,
    () => {
      if (currentFieldIdx < fieldOrder.length - 1) {
        const nextIdx = currentFieldIdx + 1;
        const nextKey = fieldOrder[nextIdx];
        if (nextKey === 'status') {
          setActiveField(null);
          timerARef.current = setTimeout(() => {
            setStatusOpen(true);
            timerBRef.current = setTimeout(() => {
              setStatusSelected(true);
              setStatusOpen(false);
              timerARef.current = setTimeout(() => {
                setCurrentFieldIdx(nextIdx + 1);
                setActiveField(fieldOrder[nextIdx + 1]);
              }, 600);
            }, 700);
          }, 300);
        } else {
          setFieldValues(prev => ({ ...prev, [currentField]: currentFieldData?.value || '' }));
          timerARef.current = setTimeout(() => {
            setCurrentFieldIdx(nextIdx);
            setActiveField(nextKey);
          }, 200);
        }
      } else {
        setFieldValues(prev => ({ ...prev, [currentField]: currentFieldData?.value || '' }));
        setActiveField(null);
        timerARef.current = setTimeout(() => setPhase(4), 600);
      }
    }
  );

  // Phase controller
  useEffect(() => {
    if (phase === 0) {
      timerARef.current = setTimeout(() => setPhase(1), 1800);
    } else if (phase === 1) {
      setBtnPulse(true);
      timerARef.current = setTimeout(() => {
        setBtnPulse(false);
        setPhase(2);
      }, 900);
    } else if (phase === 2) {
      setModalOpen(true);
      timerARef.current = setTimeout(() => {
        setPhase(3);
        setCurrentFieldIdx(0);
        setActiveField(fieldOrder[0]);
      }, 700);
    } else if (phase === 4) {
      setSavePulse(true);
      timerARef.current = setTimeout(() => {
        setSavePulse(false);
        setShowCheck(true);
        timerBRef.current = setTimeout(() => {
          setShowCheck(false);
          setModalOpen(false);
          setPhase(5);
        }, 900);
      }, 500);
    } else if (phase === 5) {
      setTotalPitches(4);
      setShowNewCard(true);
      timerARef.current = setTimeout(() => {
        setNewCardHighlight(true);
        timerBRef.current = setTimeout(() => {
          setNewCardHighlight(false);
          setPhase(6);
        }, 2000);
      }, 200);
    } else if (phase === 6) {
      timerARef.current = setTimeout(() => {
        reset();
      }, 3000);
    }

    return () => {
      if (timerARef.current) clearTimeout(timerARef.current);
      if (timerBRef.current) clearTimeout(timerBRef.current);
    };
  }, [phase, fieldOrder, reset]);

  // Sync displayed value into fieldValues while typing
  useEffect(() => {
    if (phase === 3 && activeField) {
      setFieldValues(prev => ({ ...prev, [activeField]: displayed }));
    }
  }, [displayed, activeField, phase]);

  const getFieldDisplay = (key: string) => {
    if (phase === 3 && activeField === key) {
      return displayed + (showCursor && cursorOn ? '|' : '');
    }
    return fieldValues[key] || '';
  };

  const isFieldActive = (key: string) => phase === 3 && activeField === key;

  return (
    <>
      <style>{`
        .demo-sidebar { display: flex !important; }
        @media (max-width: 480px) {
          .demo-sidebar { display: none !important; }
          .demo-topbar-label { font-size: 0.55rem !important; }
          .demo-new-btn { font-size: 0.6rem !important; padding: 4px 9px !important; }
          .demo-tab { font-size: 0.55rem !important; padding: 2px 7px !important; }
          .demo-cards-grid { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
          .demo-modal-form { grid-template-columns: 1fr !important; }
          .demo-modal-inner { padding: 14px 14px 16px !important; }
          .demo-field-label { font-size: 0.52rem !important; }
          .demo-field-input { font-size: 0.65rem !important; padding: 5px 8px !important; min-height: 26px !important; }
          .demo-metrics-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }
          .demo-metric-label { font-size: 0.45rem !important; }
          .demo-metric-value { font-size: 0.7rem !important; }
        }
      `}</style>

      <div style={{
        background: '#f8f8f6',
        display: 'flex',
        height: isMobile ? 480 : 420,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Barlow, -apple-system, sans-serif',
        fontSize: '0.72rem',
      }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: isMobile ? '7px 10px' : '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div className="demo-topbar-label" style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.04em' }}>
              MANAGEMENT / <span style={{ color: '#111', fontWeight: 600 }}>Pitches</span>
            </div>
            <button
              className="demo-new-btn"
              style={{
                background: btnPulse ? '#1d4ed8' : '#111',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                padding: '5px 12px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'default',
                transform: btnPulse ? 'scale(1.08)' : 'scale(1)',
                boxShadow: btnPulse ? '0 0 0 4px rgba(29,78,216,0.25)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >+ New Pitch</button>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '8px' : '12px', display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8 }}>
            {/* Metrics */}
            <div className="demo-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? 4 : 6 }}>
              {[
                { label: 'Total Pitches', value: String(totalPitches) },
                { label: 'Approval Rate', value: '62%' },
                { label: 'Avg Review', value: '12d' },
                { label: 'Recent (7D)', value: '3' },
              ].map(m => (
                <div key={m.label} style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: isMobile ? 6 : 8, padding: isMobile ? '5px 6px' : '8px 10px',
                }}>
                  <div className="demo-metric-label" style={{ fontSize: '0.5rem', color: '#9ca3af', marginBottom: 2 }}>{m.label}</div>
                  <div className="demo-metric-value" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { label: `${totalPitches} Total`, active: true },
                { label: '3 New', color: '#1d4ed8', bg: '#dbeafe' },
                { label: '2 In Review', color: '#92400e', bg: '#fef3c7' },
                { label: '2 Approved', color: '#166534', bg: '#dcfce7' },
                { label: '1 Rejected', color: '#991b1b', bg: '#fee2e2' },
              ].map(tab => (
                <div key={tab.label} className="demo-tab" style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 600,
                  background: tab.active ? '#111' : (tab.bg || '#f3f4f6'),
                  color: tab.active ? '#fff' : (tab.color || '#6b7280'),
                  cursor: 'default',
                }}>{tab.label}</div>
              ))}
            </div>

            {/* Cards grid */}
            <div className="demo-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 6 : 8 }}>
              {EXISTING_CARDS.map(card => (
                <PitchCardItem key={card.name + card.title} card={card} compact={isMobile} />
              ))}
              {showNewCard && (
                <div style={{
                  opacity: showNewCard ? 1 : 0,
                  transform: showNewCard ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <PitchCardItem card={NEW_CARD} highlight={newCardHighlight} compact={isMobile} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal overlay */}
        {modalOpen && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 50,
          }}>
            <div className="demo-modal-inner" style={{
              background: '#fff',
              borderRadius: '12px 12px 0 0',
              width: '100%',
              maxHeight: '92%',
              padding: '18px 20px 20px',
              transform: modalOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              overflowY: 'auto',
            }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111' }}>New Pitch</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', cursor: 'default' }}>✕</div>
              </div>

              {/* Form fields */}
              <div className="demo-modal-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 12 }}>
                {FORM_FIELDS.slice(0, 4).map(field => (
                  <div key={field.key}>
                    <div className="demo-field-label" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 3 }}>{field.label.toUpperCase()}</div>
                    <div className="demo-field-input" style={{
                      border: `1.5px solid ${isFieldActive(field.key) ? '#1d4ed8' : '#e5e7eb'}`,
                      borderRadius: 7, padding: '6px 10px',
                      fontSize: '0.72rem', color: '#111',
                      background: isFieldActive(field.key) ? '#f0f5ff' : '#fafafa',
                      minHeight: 30, transition: 'all 0.2s',
                      boxShadow: isFieldActive(field.key) ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
                    }}>
                      {getFieldDisplay(field.key) || <span style={{ color: '#d1d5db' }}>{field.label}</span>}
                    </div>
                  </div>
                ))}

                {/* Status dropdown */}
                <div>
                  <div className="demo-field-label" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 3 }}>STATUS</div>
                  <div className="demo-field-input" style={{
                    border: `1.5px solid ${statusOpen ? '#1d4ed8' : '#e5e7eb'}`,
                    borderRadius: 7, padding: '6px 10px',
                    fontSize: '0.72rem', color: statusSelected ? '#1e40af' : '#9ca3af',
                    background: statusSelected ? '#dbeafe' : '#fafafa',
                    minHeight: 30, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative',
                  }}>
                    <span style={{ fontWeight: statusSelected ? 600 : 400 }}>
                      {statusSelected ? 'Sent' : 'Select status...'}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>▾</span>
                    {statusOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        zIndex: 10, overflow: 'hidden', marginTop: 2,
                      }}>
                        {['Draft', 'Sent', 'In Review', 'Approved', 'Rejected'].map((s, i) => (
                          <div key={s} style={{
                            padding: '6px 10px', fontSize: '0.7rem',
                            background: s === 'Sent' ? '#eff6ff' : 'transparent',
                            color: s === 'Sent' ? '#1d4ed8' : '#374151',
                            fontWeight: s === 'Sent' ? 600 : 400,
                            borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none',
                          }}>{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="demo-field-label" style={{ fontSize: '0.55rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 3 }}>NOTES</div>
                  <div className="demo-field-input" style={{
                    border: `1.5px solid ${isFieldActive('notes') ? '#1d4ed8' : '#e5e7eb'}`,
                    borderRadius: 7, padding: '6px 10px',
                    fontSize: '0.72rem', color: '#111',
                    background: isFieldActive('notes') ? '#f0f5ff' : '#fafafa',
                    minHeight: isMobile ? 36 : 52, transition: 'all 0.2s',
                    boxShadow: isFieldActive('notes') ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
                    lineHeight: 1.5,
                  }}>
                    {getFieldDisplay('notes') || <span style={{ color: '#d1d5db' }}>Add notes...</span>}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <div style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: isMobile ? '0.62rem' : '0.7rem',
                  fontWeight: 500, color: '#6b7280', background: '#f3f4f6',
                  cursor: 'default',
                }}>Cancel</div>
                <div style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: isMobile ? '0.62rem' : '0.7rem',
                  fontWeight: 700, color: '#fff',
                  background: savePulse ? '#1e40af' : '#1d4ed8',
                  cursor: 'default',
                  transform: savePulse ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: savePulse ? '0 0 0 4px rgba(29,78,216,0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {showCheck ? (
                    <>
                      <span style={{ fontSize: '0.8rem' }}>✓</span>
                      <span>Saved!</span>
                    </>
                  ) : 'Save Pitch'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
