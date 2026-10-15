/* Tapri audio engine.
   Everything you hear is a balanced ElevenLabs recording (see tools/normalize_audio.mjs):
   - beds: crowd + gossip murmur (two offset copies each so the loop never "pumps"), traffic, rain, birds/crickets, stove
   - foley: pour, clink, sip, tear, sizzle... fired by what the characters actually do on screen
   - voices: the spoken line for each speech bubble, panned to where that person sits
   - music: station tracks through a small radio filter (YouTube plays separately). */
const TA = (() => {
  let envMix = { traffic: 1, birds: 1, crickets: 1, crowd: 1, rain: 1 }, outAn, ctx, master, comp, wet, buses = {}, loopNodes = {}, bank = {}, voiceMap = {}, bufCache = {}, started = false, muted = false, scene = 'day';
  let musicSrc = null, station = 'off', radioOn = true, ytPlaying = false, analyser, anaData, beatSm = 0, hissG, toneLP, musicIn;
  const state = { master: 0.9, music: 0.45, crowd: 0.7, traffic: 0.5, rain: 0, nature: 0.5, chai: 0.55, voices: 0.75, crackle: 0.2 };
  const BASE = { crowd: 2.2, traffic: 2.0, rain: 2.0, nature: 2.4, chai: 3.2, voices: 2.4, music: 3.0 };
  const SCENE_MIX = { // how much of each bed a time of day wants
    morning: { traffic: 0.8, birds: 1.0, crickets: 0, crowd: 0.8 }, day: { traffic: 1.0, birds: 0.8, crickets: 0, crowd: 1.0 },
    dusk: { traffic: 0.9, birds: 0.25, crickets: 0.6, crowd: 1.0 }, night: { traffic: 0.55, birds: 0, crickets: 1.0, crowd: 0.8 }
  };
  const SFX = { dog_bark: 3, sparrow: 3, glass_clink: 2, chai_pour: 2, sip: 2, fly: 2, phone_notify: 2, laugh: 2, cough: 1, kettle: 1, chips_tear: 2, box_rustle: 1, cloth_swish: 2, coins: 2, note_rustle: 1, match_strike: 1, cola_open: 1, stool_scrape: 1, table_set: 2, kettle_lid: 1, sizzle_drop: 1, dog_yelp: 2, trickle: 1 };
  const STATIONS = { lofi: { name: 'Lo-fi Chai', file: 'audio/music/lofi.mp3' }, retro: { name: 'Purane Gaane', file: 'audio/music/retro.mp3' }, baarish: { name: 'Baarish FM', file: 'audio/music/baarish.mp3' } };
  const listeners = {}; const on = (n, f) => (listeners[n] = listeners[n] || []).push(f), emit = (n, d) => (listeners[n] || []).forEach(f => f(d));
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const curve = k => state[k] * state[k] * (BASE[k] || 1);

  async function load(url) {
    if (url in bufCache) return bufCache[url];
    try { const r = await fetch(url); if (!r.ok) throw 0; bufCache[url] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { bufCache[url] = null; console.log('LOADFAIL ' + url + ' ' + (e && (e.message || e.name) || e)); }
    return bufCache[url];
  }
  function noise(secs = 3) { const b = ctx.createBuffer(1, ctx.sampleRate * secs, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function impulse(secs = 1.1, decay = 3.2) { const n = ctx.sampleRate * secs, b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
  function bus(name) { const g = ctx.createGain(); g.gain.value = 0; g.connect(master); const s = ctx.createGain(); s.gain.value = name === 'voices' ? 0.28 : name === 'chai' ? 0.2 : 0.1; g.connect(s); s.connect(wet); buses[name] = g; return g; }
  function applyBus(k) { if (!buses[k]) return; buses[k].gain.setTargetAtTime(curve(k), ctx.currentTime, 0.15); }

  /* a looping bed: `copies` offset copies (different start + slightly different speed + stereo spread) so it never sounds like a loop */
  function bed(name, url, busName, copies, gainEach) {
    load(url).then(b => {
      if (!b) return; const group = ctx.createGain(); group.gain.value = 0; group.connect(buses[busName]); const nodes = [];
      for (let i = 0; i < copies; i++) {
        const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = 1 + (i % 2 ? 0.012 : -0.012) * (1 + i * 0.3);
        const g = ctx.createGain(); g.gain.value = gainEach; const p = ctx.createStereoPanner(); p.pan.value = copies > 1 ? (i % 2 ? 0.35 : -0.35) : 0;
        const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.04 + Math.random() * 0.05; lg.gain.value = gainEach * 0.16; lfo.connect(lg); lg.connect(g.gain); lfo.start();
        s.connect(g); g.connect(p); p.connect(group); s.start(0, (b.duration / copies) * i + rnd(0, 2)); nodes.push(s);
      }
      loopNodes[name] = { group }; applyScene(); emit('bed', name);
    });
  }
  function setLoop(name, on, vol = 1) { const l = loopNodes[name]; if (l) l.group.gain.setTargetAtTime(on ? vol : 0, ctx.currentTime, on ? 0.25 : 0.5); }
  function applyScene() {
    const m = SCENE_MIX[scene] || SCENE_MIX.day, set = (n, v, t = 1.5) => { const l = loopNodes[n]; if (l) l.group.gain.setTargetAtTime(v, ctx.currentTime, t); };
    set('crowd', 0.9 * m.crowd * envMix.crowd); set('gossip', 0.8 * m.crowd * envMix.crowd); set('traffic', 0.95 * m.traffic * envMix.traffic); set('birds', m.birds * envMix.birds); set('crickets', m.crickets * envMix.crickets); set('rain', 1); set('stove', 0.8);
  }

  async function loadBank() {
    for (const [n, k] of Object.entries(SFX)) for (let i = 1; i <= k; i++) { const b = await load(`audio/sfx/${n}_${i}.mp3`); if (b) (bank[n] = bank[n] || []).push(b); }
    try { const r = await fetch('audio/voice2/manifest.json'); if (r.ok) voiceMap = (await r.json()).lines || {}; } catch (e) {}
    emit('bank', Object.keys(bank).length);
  }

  const api = {
    on, state, STATIONS, get started() { return started; }, get muted() { return muted; },
    async start() {
      if (started) return; ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : state.master; comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3.2; comp.attack.value = 0.01; comp.release.value = 0.3; master.connect(comp); comp.connect(ctx.destination); outAn = ctx.createAnalyser(); outAn.fftSize = 2048; comp.connect(outAn);
      wet = ctx.createConvolver(); wet.buffer = impulse(); const wg = ctx.createGain(); wg.gain.value = 0.7; wet.connect(wg); wg.connect(master);
      for (const k of ['crowd', 'traffic', 'rain', 'nature', 'chai', 'voices']) bus(k);
      // radio chain
      musicIn = ctx.createGain(); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 160; const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1200; pk.gain.value = 2.5; pk.Q.value = 0.8;
      toneLP = ctx.createBiquadFilter(); toneLP.type = 'lowpass'; toneLP.frequency.value = 5500; const mg = ctx.createGain(); mg.gain.value = 0; buses.music = mg; musicIn.connect(hp); hp.connect(pk); pk.connect(toneLP); toneLP.connect(mg); mg.connect(master);
      analyser = ctx.createAnalyser(); analyser.fftSize = 512; anaData = new Uint8Array(analyser.frequencyBinCount); mg.connect(analyser);
      const hs = ctx.createBufferSource(); hs.buffer = noise(); hs.loop = true; const hb = ctx.createBiquadFilter(); hb.type = 'bandpass'; hb.frequency.value = 2600; hb.Q.value = 0.5; hissG = ctx.createGain(); hissG.gain.value = 0; hs.connect(hb); hb.connect(hissG); hissG.connect(master); hs.start();
      started = true; ['crowd', 'traffic', 'rain', 'nature', 'chai', 'voices', 'music'].forEach(applyBus);
      bed('crowd', 'audio/amb/crowd.mp3', 'crowd', 2, 0.6); bed('gossip', 'audio/amb/gossip.mp3', 'crowd', 2, 0.5); bed('traffic', 'audio/amb/traffic.mp3', 'traffic', 1, 0.9); bed('rain', 'audio/amb/rain.mp3', 'rain', 2, 0.6);
      bed('birds', 'audio/amb/birds.mp3', 'nature', 2, 0.7); bed('crickets', 'audio/amb/crickets.mp3', 'nature', 2, 0.7); bed('stove', 'audio/amb/stove.mp3', 'chai', 1, 0.7);
      bed('samosa_fry', 'audio/amb/samosa_fry.mp3', 'chai', 1, 1.0); bed('glass_wash', 'audio/amb/glass_wash.mp3', 'chai', 1, 1.0);
      setTimeout(() => { setLoop('samosa_fry', false); setLoop('glass_wash', false); }, 0); loadBank();
    },
    resume() { if (ctx && ctx.state !== 'running') ctx.resume(); },
    setMuted(m) { muted = !!m; if (master) master.gain.setTargetAtTime(muted ? 0 : state.master, ctx.currentTime, 0.08); emit('mute', muted); },
    toggleMute() { api.setMuted(!muted); return muted; },
    set(k, v) { state[k] = v; if (!started) return; if (k === 'master') { if (!muted) master.gain.setTargetAtTime(v, ctx.currentTime, 0.1); } else if (k === 'music') api.applyMusicVol(); else if (k === 'crackle') {} else applyBus(k === 'nature' ? 'nature' : k); },
    applyMusicVol() { if (!buses.music) return; buses.music.gain.setTargetAtTime(radioOn && musicSrc ? curve('music') : 0, ctx.currentTime, 0.15); },
    setTone(v) { if (toneLP) toneLP.frequency.setTargetAtTime(1500 + v * v * 12000, ctx.currentTime, 0.1); },
    setEnvMix(mx) { envMix = Object.assign({ traffic: 1, birds: 1, crickets: 1, crowd: 1, rain: 1 }, mx || {}); if (started) applyScene(); },
    setScene(s) { scene = s; if (started) applyScene(); },
    setLoop, setRadio(on) { radioOn = on; if (!on) api.stopMusic(); api.applyMusicVol(); },
    stopMusic() { if (musicSrc) { try { musicSrc.stop(ctx.currentTime + 0.2); } catch (e) {} musicSrc = null; } },
    staticBurst(d = 0.5) { if (!started || muted) return; const g = hissG.gain, t = ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(0.14, t + 0.05); g.exponentialRampToValueAtTime(0.0001, t + d); },
    async tune(id) {
      if (!started) return; station = id; api.stopMusic(); api.staticBurst(0.6);
      if (id === 'off' || id === 'yt') { api.applyMusicVol(); return; }
      const b = await load(STATIONS[id].file); if (station !== id || !b) return;
      const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; s.connect(musicIn); s.start(ctx.currentTime + 0.35, rnd(0, 20)); musicSrc = s; api.applyMusicVol();
    },
    ytPlaying(b) { ytPlaying = b; }, isPlaying() { return radioOn && !muted && ((station === 'yt' && ytPlaying) || (!!musicSrc && station !== 'off')); },
    beat(t) { let v = 0; if (!radioOn || muted) return 0; if (musicSrc && analyser) { analyser.getByteFrequencyData(anaData); let s = 0; for (let i = 1; i < 8; i++) s += anaData[i]; v = Math.min(1, s / 8 / 170); } else if (station === 'yt' && ytPlaying) v = Math.pow(Math.sin(t * Math.PI * 2 * 1.9) * 0.5 + 0.5, 3); beatSm += (v - beatSm) * 0.35; return beatSm; },
    /* one-shot foley; returns true if a recording played */
    sfx(name, o = {}) {
      if (!started || muted) return false; const arr = bank[name]; if (!arr || !arr.length) return false; const bn = o.bus || (['dog_bark', 'dog_yelp', 'sparrow', 'fly'].includes(name) ? 'nature' : ['laugh', 'cough'].includes(name) ? 'crowd' : 'chai');
      const s = ctx.createBufferSource(); s.buffer = pick(arr); s.playbackRate.value = (o.rate || 1) * rnd(0.97, 1.03); const g = ctx.createGain(); g.gain.value = (o.vol === undefined ? 1 : o.vol); const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan || 0, -1, 1);
      s.connect(g); g.connect(p); p.connect(buses[bn]); s.start(ctx.currentTime + (o.delay || 0)); return true;
    },
    /* spoken line for a speech bubble. resolves with its duration in seconds (0 if there is no recording) */
    async say(voice, text, x = 240, W = 480) {
      if (!started || muted) return 0; const f = voiceMap[voice + '|' + text]; if (!f) return 0; const b = await load('audio/' + f); if (!b) return 0;
      const s = ctx.createBufferSource(); s.buffer = b; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 150; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
      const g = ctx.createGain(); g.gain.value = 0.9; const p = ctx.createStereoPanner(); p.pan.value = clamp(x / (W / 2) - 1, -1, 1) * 0.8; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(p); p.connect(buses.voices); s.start(); return b.duration;
    },
    level() { if (!outAn) return -999; const d = new Float32Array(outAn.fftSize); outAn.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return 10 * Math.log10(s / d.length + 1e-12); },
    debug() { const o = {}; for (const k in loopNodes) o[k] = +loopNodes[k].group.gain.value.toFixed(2); const b = {}; for (const k in buses) b[k] = +buses[k].gain.value.toFixed(3); return { loops: o, buses: b, ctx: ctx && ctx.state, muted }; },
    hasVoice(voice, text) { return !!voiceMap[voice + '|' + text]; },
    pop() { if (!started || muted) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.05); g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.1); }
  };
  return api;
})();
