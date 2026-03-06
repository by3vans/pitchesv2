'use client';

import { useEffect, useRef, useCallback } from 'react';

export default function AnimatedPitchDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const typeInto = async (el: HTMLInputElement, text: string, speed = 70) => {
    el.value = '';
    for (const ch of text) {
      el.value += ch;
      await sleep(speed + Math.random() * 30);
    }
  };

  const showScreen = useCallback((id: string) => {
    const c = containerRef.current;
    if (!c) return;
    c.querySelectorAll('.ph-screen').forEach(s => s.classList.remove('active'));
    c.querySelector(`#${id}`)?.classList.add('active');
  }, []);

  const showModal = useCallback((id: string) => {
    containerRef.current?.querySelector(`#${id}`)?.classList.add('visible');
  }, []);

  const hideModal = useCallback((id: string) => {
    containerRef.current?.querySelector(`#${id}`)?.classList.remove('visible');
  }, []);

  const g = useCallback((id: string) => {
    return containerRef.current?.querySelector(`#${id}`) as HTMLElement | null;
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const c = containerRef.current;
    if (!c) { runningRef.current = false; return; }

    // ── RESET ──
    g('spotify-modal')?.classList.remove('visible');
    g('recipient-modal')?.classList.remove('visible');
    g('toast')?.classList.remove('visible');
    g('beyonce-result')?.classList.remove('selected');
    const newCard = g('new-artist-card');
    if (newCard) { newCard.style.opacity = '0'; newCard.style.transform = 'scale(0.95)'; }
    const contactResult = g('contact-result');
    if (contactResult) contactResult.style.opacity = '0';
    const addRecBtn = g('add-rec-btn');
    if (addRecBtn) addRecBtn.style.opacity = '0.4';
    g('rec-row-1')?.classList.remove('visible');
    const recipEmpty = g('recipients-empty');
    if (recipEmpty) recipEmpty.style.display = 'block';
    const linkedCount = g('linked-count');
    if (linkedCount) linkedCount.textContent = '0';
    const recCountBadge = g('rec-count-badge');
    if (recCountBadge) recCountBadge.textContent = '0';
    const recipientCount = g('recipient-count');
    if (recipientCount) recipientCount.textContent = '0 recipients';
    ['act-1', 'act-2', 'act-3'].forEach(id => g(id)?.classList.remove('visible'));
    const urlBar = g('url-bar');
    if (urlBar) urlBar.textContent = 'pitchhood.com/artists';
    showScreen('screen-1');

    await sleep(1000);
    showModal('spotify-modal');
    await sleep(600);

    const spotifySearch = g('spotify-search') as HTMLInputElement | null;
    if (spotifySearch) await typeInto(spotifySearch, 'beyonce', 80);
    await sleep(700);

    g('beyonce-result')?.classList.add('selected');
    await sleep(800);

    hideModal('spotify-modal');
    await sleep(400);
    if (newCard) { newCard.style.opacity = '1'; newCard.style.transform = 'scale(1)'; }
    await sleep(1200);

    if (urlBar) urlBar.textContent = 'pitchhood.com/artist-detail';
    showScreen('screen-2');
    await sleep(800);

    showModal('recipient-modal');
    await sleep(500);

    const contactSearch = g('contact-search-input') as HTMLInputElement | null;
    if (contactSearch) await typeInto(contactSearch, 'James', 90);
    await sleep(500);

    if (contactResult) contactResult.style.opacity = '1';
    await sleep(600);

    if (addRecBtn) addRecBtn.style.opacity = '1';
    await sleep(800);

    hideModal('recipient-modal');
    await sleep(400);

    if (recipEmpty) recipEmpty.style.display = 'none';
    g('rec-row-1')?.classList.add('visible');
    if (linkedCount) linkedCount.textContent = '1';
    if (recCountBadge) recCountBadge.textContent = '1';
    if (recipientCount) recipientCount.textContent = '1 recipient · 1 primary';

    await sleep(400);
    g('toast')?.classList.add('visible');
    await sleep(2000);
    g('toast')?.classList.remove('visible');
    await sleep(600);

    showScreen('screen-3');
    await sleep(300);
    g('act-1')?.classList.add('visible');
    await sleep(300);
    g('act-2')?.classList.add('visible');
    await sleep(300);
    g('act-3')?.classList.add('visible');
    await sleep(4000);

    runningRef.current = false;
    run();
  }, [g, showScreen, showModal, hideModal]);

  useEffect(() => {
    run();
    return () => { runningRef.current = false; };
  }, [run]);

  return (
    <>
      <style>{`
        .ph-screen { position: absolute; inset: 0; padding: 18px 20px; opacity: 0; transition: opacity 0.4s ease; pointer-events: none; overflow-y: auto; }
        .ph-screen.active { opacity: 1; pointer-events: all; }

        .ph-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 10; }
        .ph-modal-overlay.visible { opacity: 1; pointer-events: all; }
        .ph-modal { background: #fff; border-radius: 12px; padding: 20px; width: 88%; max-height: 90%; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.15); transform: scale(0.95) translateY(8px); transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .ph-modal-overlay.visible .ph-modal { transform: scale(1) translateY(0); }

        .ph-spotify-result { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: default; border: 1.5px solid transparent; transition: background 0.2s; }
        .ph-spotify-result.selected { background: #f0fdf4 !important; border-color: #1DB954 !important; }
        .ph-result-check { margin-left: auto; width: 20px; height: 20px; border-radius: 50%; background: #1DB954; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; opacity: 0; transition: opacity 0.3s; flex-shrink: 0; }
        .ph-spotify-result.selected .ph-result-check { opacity: 1; }

        .ph-rec-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f9fafb; opacity: 0; transform: translateY(6px); transition: all 0.4s ease; }
        .ph-rec-row.visible { opacity: 1; transform: translateY(0); }

        .ph-activity-row { display: flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f9fafb; border-radius: 8px; opacity: 0; transform: translateX(-6px); transition: all 0.4s ease; }
        .ph-activity-row.visible { opacity: 1; transform: translateX(0); }

        .ph-toast { position: absolute; bottom: 14px; right: 14px; background: #111827; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; min-width: 180px; opacity: 0; transform: translateY(8px) scale(0.95); transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1); z-index: 20; pointer-events: none; }
        .ph-toast.visible { opacity: 1; transform: translateY(0) scale(1); }

        .ph-new-card { opacity: 0; transform: scale(0.95); transition: opacity 0.5s ease, transform 0.5s ease; }

        .ph-sent-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #7c3aed; animation: ph-pulse 1.5s infinite; vertical-align: middle; margin-right: 2px; }
        @keyframes ph-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .ph-sidebar-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 7px; font-size: 12px; color: #9ca3af; margin-bottom: 1px; cursor: default; }
        .ph-sidebar-item.active { background: rgba(255,255,255,0.1); color: #fff; }
        .ph-sidebar-item svg { width: 14px; height: 14px; flex-shrink: 0; }
      `}</style>

      <div
        ref={containerRef}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', display: 'flex', height: 460, overflow: 'hidden', position: 'relative' }}
      >
        {/* ── SIDEBAR ── */}
        <div style={{ width: 160, background: '#111827', padding: '14px 10px', borderRight: '1px solid #1f2937', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '0 4px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#111' }}>P</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Pitchhood</span>
          </div>
          {([
            { label: 'Dashboard', active: false, path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { label: 'Pitches', active: false, path: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
            { label: 'Artists', active: true, path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { label: 'Contacts', active: false, path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          ] as { label: string; active: boolean; path: string }[]).map(item => (
            <div key={item.label} className={`ph-sidebar-item${item.active ? ' active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.path}/></svg>
              {item.label}
            </div>
          ))}
          <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 4px' }}>Workflow</div>
          {([
            { label: 'Activity', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { label: 'Reminders', path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
            { label: 'Templates', path: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
          ] as { label: string; path: string }[]).map(item => (
            <div key={item.label} className="ph-sidebar-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.path}/></svg>
              {item.label}
            </div>
          ))}
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, background: '#fff', overflow: 'hidden', position: 'relative' }}>

          {/* URL bar */}
          <div style={{ background: '#f9fafb', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
            <div id="url-bar" style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', margin: '0 10px' }}>
              pitchhood.com/artists
            </div>
          </div>

          {/* Screens container */}
          <div style={{ position: 'relative', flex: 1, height: 'calc(100% - 37px)' }}>

            {/* ── SCREEN 1: Artists ── */}
            <div id="screen-1" className="ph-screen active">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Management</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Artists</div>
                </div>
                <button style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'default' }}>+ Add Artist</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Rihanna */}
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>R</div>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>● Active</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Rihanna</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>NYC</div>
                  <span style={{ background: '#f3f4f6', color: '#374151', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>Pop</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                    {[['4','Pitches'],['2','Approved'],['50%','Rate']].map(([v,l]) => (
                      <div key={l}><div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{v}</div><div style={{ fontSize: 8, color: '#9ca3af' }}>{l}</div></div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: '#d1d5db', marginTop: 6 }}>06/03/2026</div>
                </div>

                {/* Beyoncé - appears after Spotify */}
                <div id="new-artist-card" className="ph-new-card" style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>B</div>
                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>● Active</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>Beyoncé</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>Houston, TX</div>
                  <span style={{ background: '#f3f4f6', color: '#374151', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>R&B</span>
                  <span style={{ background: '#f3f4f6', color: '#374151', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, marginLeft: 4 }}>Pop</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                    {[['0','Pitches'],['0','Approved'],['0%','Rate']].map(([v,l]) => (
                      <div key={l}><div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{v}</div><div style={{ fontSize: 8, color: '#9ca3af' }}>{l}</div></div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: '#d1d5db', marginTop: 6 }}>06/03/2026</div>
                </div>
              </div>

              {/* Spotify Modal */}
              <div id="spotify-modal" className="ph-modal-overlay">
                <div className="ph-modal">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, background: '#1DB954', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>♫</div>
                      <div>
                        <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spotify</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Fetch Artist Metadata</div>
                      </div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6b7280' }}>×</div>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 4 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af' }}>🔍</span>
                    <input id="spotify-search" readOnly style={{ width: '100%', border: '1.5px solid #7c3aed', borderRadius: 8, padding: '9px 12px 9px 30px', fontSize: 12, color: '#111827', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 10 }}>Press Enter to search · Select a result to populate artist fields</div>

                  {[
                    { id: 'beyonce-result', emoji: '👸', name: 'Beyoncé', meta: 'Artist · R&B / Pop · 94M monthly listeners' },
                    { id: '', emoji: '🎵', name: 'Beyoncé Knowles', meta: 'Artist · Soul · 1.2M monthly listeners' },
                    { id: '', emoji: '🎵', name: 'Beyoncé Tribute Band', meta: 'Artist · Pop · 340K monthly listeners' },
                  ].map((r, i) => (
                    <div key={i} {...(r.id ? { id: r.id } : {})} className="ph-spotify-result">
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{r.emoji}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{r.meta}</div>
                      </div>
                      <div className="ph-result-check">✓</div>
                    </div>
                  ))}
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>Data provided by Spotify Web API</div>
                </div>
              </div>
            </div>

            {/* ── SCREEN 2: Artist Detail ── */}
            <div id="screen-2" className="ph-screen">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Artist Profile</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Beyoncé</div>
                <div id="recipient-count" style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>0 recipients</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: 14, border: '1px solid #e5e7eb', borderRadius: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>B</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Beyoncé</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span>🎵 R&B / Pop</span>
                    <span>📍 Houston, TX</span>
                    <span>👤 <span id="linked-count">0</span> primary contacts</span>
                  </div>
                </div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
                    Recipients <span id="rec-count-badge" style={{ background: '#f3f4f6', color: '#374151', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, marginLeft: 4 }}>0</span>
                  </div>
                  <button style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 10, fontWeight: 600, cursor: 'default' }}>+ Add Recipient</button>
                </div>
                <div id="recipients-empty" style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>No recipients linked to this artist yet.</div>
                <div id="rec-row-1" className="ph-rec-row">
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>JR</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>James Reid</div>
                    <div style={{ fontSize: 9, color: '#9ca3af' }}>Manager · JR · james@sonymusic.com</div>
                  </div>
                  <span style={{ background: '#f3f4f6', color: '#374151', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>Manager</span>
                  <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>A&R</span>
                </div>
              </div>

              {/* Add Recipient Modal */}
              <div id="recipient-modal" className="ph-modal-overlay">
                <div className="ph-modal">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Link Contact</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Add Recipient</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6b7280' }}>×</div>
                  </div>
                  <input id="contact-search-input" readOnly placeholder="Search by name, company, email..." style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#111827', outline: 'none', background: '#fff', marginBottom: 8 }} />
                  <div id="contact-result" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111827', borderRadius: 8, marginBottom: 8, opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>J</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>James Reid</div>
                      <div style={{ fontSize: 9, color: '#6b7280' }}>Manager · JR · james@sonymusic.com</div>
                    </div>
                    <span style={{ color: '#1DB954', fontSize: 14 }}>✓</span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Relationship Type</div>
                  <select style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#111827', background: '#fff', outline: 'none' }}>
                    <option>A&R</option><option>Manager</option><option>Producer</option><option>Music Supervisor</option>
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button style={{ background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'default' }}>Cancel</button>
                    <button id="add-rec-btn" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'default', display: 'flex', alignItems: 'center', gap: 5, opacity: 0.4, transition: 'opacity 0.3s' }}>+ Add Recipient</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SCREEN 3: Success ── */}
            <div id="screen-3" className="ph-screen">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', flexShrink: 0 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Recipient linked successfully!</div>
                    <div style={{ fontSize: 10, color: '#4ade80', marginTop: 1 }}>James Reid → A&R at Sony Music</div>
                  </div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>Artist ready to pitch</div>
                    <div style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="ph-sent-dot" /> Ready
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>B</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>Beyoncé</div>
                        <div style={{ fontSize: 9, color: '#9ca3af' }}>R&B · Pop · 94M listeners</div>
                      </div>
                    </div>
                    <div style={{ paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Recipients</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>James Reid</span>
                        <span style={{ fontSize: 9, color: '#9ca3af' }}>· A&R · Sony Music</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Activity</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { id: 'act-1', color: '#7c3aed', text: 'Artist Beyoncé added via Spotify' },
                      { id: 'act-2', color: '#6366f1', text: 'James Reid linked as A&R recipient' },
                      { id: 'act-3', color: '#1DB954', text: 'Profile ready · 94M Spotify listeners' },
                    ].map(row => (
                      <div key={row.id} id={row.id} className="ph-activity-row">
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                        <div style={{ fontSize: 10, color: '#374151', flex: 1 }}>{row.text}</div>
                        <div style={{ fontSize: 9, color: '#9ca3af' }}>just now</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end screens container */}

          {/* ── TOAST ── */}
          <div id="toast" className="ph-toast">
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Recipient linked!</div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>James Reid → A&R · Sony Music</div>
            </div>
          </div>

        </div>{/* end main */}
      </div>
    </>
  );
}