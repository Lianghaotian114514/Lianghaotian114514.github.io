// ============================================================
// 硬核军事音频系统：真实质感音效 + 雄壮而悲凉的军乐
// 全部为 WebAudio 程序化合成（无任何音频素材文件）
// ============================================================

type Dest = AudioNode;

export type BgmMode = "prep" | "battle" | "flag" | "epic";

export class SFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private comp: DynamicsCompressorNode | null = null;
  private conv: ConvolverNode | null = null;   // 走廊混响
  private wet: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  private flameNodes: { srcs: AudioBufferSourceNode[]; gain: GainNode } | null = null;
  private laserNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null = null;
  private engineNodes: { osc: OscillatorNode; sub: OscillatorNode; src: AudioBufferSourceNode; gain: GainNode; filt: BiquadFilterNode } | null = null;


  // ---------------- 基础设施 ----------------
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();

    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 7;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.2;

    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.62;
    this.master.connect(this.comp).connect(this.ctx.destination);

    // 走廊混响（程序化脉冲响应）
    const sr = this.ctx.sampleRate;
    const irLen = Math.floor(sr * 1.1);
    const ir = this.ctx.createBuffer(2, irLen, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        const t = i / irLen;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (1 - t * 0.2);
      }
      // 早期反射（硬墙走廊）
      [0.013, 0.021, 0.037, 0.058].forEach((dly, k) => {
        const idx = Math.floor(dly * sr);
        if (idx < irLen) d[idx] += (k % 2 ? -1 : 1) * 0.5 / (k + 1);
      });
    }
    this.conv = this.ctx.createConvolver();
    this.conv.buffer = ir;
    this.wet = this.ctx.createGain();
    this.wet.gain.value = 0.26;
    this.conv.connect(this.wet).connect(this.master);

    const len = sr * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, sr);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.62, this.ctx.currentTime, 0.02);
  }

  private out(space = 0): Dest {
    // space=0 干声，>0 送混响
    if (space > 0 && this.conv) return this.conv;
    return this.master!;
  }

  private tone(
    freq: number, dur: number, type: OscillatorType = "square",
    gain = 0.16, slideTo = 0, space = 0, detune = 0
  ) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.detune.value = detune;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo > 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    if (space > 0) {
      const sg = this.ctx.createGain();
      sg.gain.value = space;
      g.connect(sg).connect(this.out(1));
    }
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  private noise(
    dur: number, filterFreq = 1200, gain = 0.2,
    type: BiquadFilterType = "lowpass", space = 0, q = 1, sweepTo = 0
  ) {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(filterFreq, t);
    if (sweepTo > 0) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    g.connect(this.master);
    if (space > 0) {
      const sg = this.ctx.createGain();
      sg.gain.value = space;
      g.connect(sg).connect(this.out(1));
    }
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  // ============================================================
  // UI（硬核：机械开关质感）
  // ============================================================
  click() { this.noise(0.03, 3200, 0.16, "bandpass", 0, 6); this.tone(180, 0.035, "square", 0.08, 90); }
  deny() { this.noise(0.08, 420, 0.2, "lowpass"); this.tone(96, 0.18, "sawtooth", 0.14, 62); }

  // ============================================================
  // 武器（真实质感）
  // ============================================================
  /** 喷枪爆燃：点火爆鸣 + 低频气浪 */
  burst() {
    if (!this.ctx) return;
    this.noise(0.045, 5200, 0.3, "highpass", 0, 1);              // 点火啪
    this.noise(0.5, 900, 0.5, "lowpass", 0.5, 1, 160);           // 气浪扩散
    this.tone(132, 0.32, "sawtooth", 0.26, 42, 0.3);             // 低频冲击
    this.tone(64, 0.5, "sine", 0.3, 30);
  }
  melee() {
    this.noise(0.05, 2400, 0.22, "bandpass", 0.2, 3);
    this.tone(760, 0.05, "square", 0.08, 420);
    this.noise(0.14, 700, 0.1, "lowpass");
  }
  /** 持续喷火：双层噪声（低频轰鸣 + 高频嘶声） */
  flameStart() {
    if (!this.ctx || !this.master || this.flameNodes || !this.noiseBuf) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.34, t, 0.05);
    g.connect(this.master);
    const sg = this.ctx.createGain();
    sg.gain.value = 0.4;
    g.connect(sg).connect(this.out(1));
    const srcs: AudioBufferSourceNode[] = [];
    // 低频轰鸣
    const a = this.ctx.createBufferSource();
    a.buffer = this.noiseBuf; a.loop = true; a.playbackRate.value = 0.55;
    const af = this.ctx.createBiquadFilter();
    af.type = "lowpass"; af.frequency.value = 420; af.Q.value = 2;
    a.connect(af).connect(g); a.start(); srcs.push(a);
    // 高频嘶声
    const b = this.ctx.createBufferSource();
    b.buffer = this.noiseBuf; b.loop = true; b.playbackRate.value = 1.6;
    const bf = this.ctx.createBiquadFilter();
    bf.type = "bandpass"; bf.frequency.value = 2600; bf.Q.value = 0.8;
    const bg = this.ctx.createGain(); bg.gain.value = 0.42;
    b.connect(bf).connect(bg).connect(g); b.start(); srcs.push(b);
    this.flameNodes = { srcs, gain: g };
  }
  flameStop() {
    if (!this.ctx || !this.flameNodes) return;
    const { srcs, gain } = this.flameNodes;
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    setTimeout(() => srcs.forEach((s) => { try { s.stop(); } catch { /* noop */ } }), 260);
    this.flameNodes = null;
  }
  /** 激光：高压电容充放电嗡鸣 */
  laserStart() {
    if (!this.ctx || !this.master || this.laserNodes) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 118;
    const sh = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 3.2); }
    sh.curve = curve;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1750; bp.Q.value = 5;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 47;
    const lg = this.ctx.createGain(); lg.gain.value = 420;
    lfo.connect(lg).connect(bp.frequency);
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.09, t, 0.03);
    osc.connect(sh).connect(bp).connect(g).connect(this.master);
    osc.start(); lfo.start();
    this.laserNodes = { osc, gain: g, lfo };
  }
  laserStop() {
    if (!this.ctx || !this.laserNodes) return;
    const { osc, gain, lfo } = this.laserNodes;
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
    setTimeout(() => { try { osc.stop(); lfo.stop(); } catch { /* noop */ } }, 180);
    this.laserNodes = null;
  }
  ignite() { this.noise(0.42, 1800, 0.26, "bandpass", 0.3, 0.7, 320); }
  blind() { this.tone(2400, 0.26, "sine", 0.12, 420); this.noise(0.3, 5200, 0.1, "highpass"); }

  // ============================================================
  // 战斗反馈（硬核：布料/金属/骨肉质感）
  // ============================================================
  hit() { this.noise(0.045, 1500, 0.14, "bandpass", 0, 2); this.tone(220, 0.04, "triangle", 0.07, 120); }
  hurt() { this.noise(0.12, 600, 0.3, "lowpass", 0.2); this.tone(105, 0.2, "sawtooth", 0.2, 52); }
  kill() {
    this.noise(0.18, 900, 0.26, "lowpass", 0.3);
    this.tone(150, 0.16, "square", 0.1, 60);
    this.noise(0.4, 300, 0.12, "lowpass");
  }
  doorHit() {
    this.noise(0.2, 240, 0.42, "lowpass", 0.6);
    this.tone(74, 0.3, "triangle", 0.34, 38, 0.4);
    this.tone(148, 0.1, "square", 0.1, 90);
  }
  shieldBlock() { this.noise(0.07, 3600, 0.2, "bandpass", 0.5, 7); this.tone(1420, 0.08, "triangle", 0.09, 900); }
  melt() { this.noise(0.6, 760, 0.26, "lowpass", 0.4, 1, 180); this.tone(180, 0.5, "sawtooth", 0.1, 60); }
  explosion(big = false) {
    const d = big ? 1.5 : 0.7;
    this.noise(0.05, 6000, big ? 0.5 : 0.3, "highpass");               // 初爆
    this.noise(d, big ? 260 : 460, big ? 0.7 : 0.45, "lowpass", 0.8, 1, 70);
    this.tone(big ? 58 : 92, d * 0.8, "sine", big ? 0.55 : 0.35, 26, 0.5);
    if (big) setTimeout(() => this.noise(1.2, 180, 0.22, "lowpass", 1), 180); // 回声轰鸣
  }
  zap() { this.noise(0.04, 5600, 0.14, "highpass"); this.tone(1800, 0.05, "square", 0.08, 240); }
  stink() { this.noise(0.7, 520, 0.24, "lowpass", 0.5, 1, 140); this.tone(190, 0.6, "sawtooth", 0.1, 58); }

  // ============================================================
  // 角色
  // ============================================================
  heal() { this.tone(523, 0.07, "triangle", 0.09); this.noise(0.1, 2600, 0.06, "bandpass", 0, 4); }
  inhale() { this.noise(0.55, 1600, 0.16, "bandpass", 0.2, 1.4, 600); }
  asthma() { this.noise(0.9, 760, 0.26, "bandpass", 0.3, 2.4, 280); this.tone(240, 0.7, "sawtooth", 0.08, 120); }
  throwIt() { this.noise(0.16, 1800, 0.14, "bandpass", 0.2, 2, 700); }

  // ============================================================
  // 电报机：真实继电器 + 电键敲击 + 火花
  // ============================================================
  /**
   * 电键敲击：真实「音响器」(sounder) 质感
   * 衔铁撞击上/下砧 → 清脆的「滴/答」双声，金属腔体短促共鸣
   */
  key(long = false, vol = 1) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    // 电报蜂鸣音：短符「滴」(dit)，长符「答」(dah)
    const dur = long ? 0.19 : 0.075;
    const f0 = long ? 700 : 880;        // 长符略低、短符略高 → 滴滴答答的听感
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.19 * vol, t + 0.006);  // 快速起振
    g.gain.setValueAtTime(0.19 * vol, t + dur - 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);        // 干脆收尾
    g.connect(this.master);
    const rg = this.ctx.createGain();
    rg.gain.value = 0.3;
    g.connect(rg).connect(this.out(1));
    // 基频 + 轻微谐波 → 老式蜂鸣器音色（不是纯正弦）
    for (const [mul, amp, type] of [
      [1, 1.0, "sine"], [2, 0.3, "sine"], [3, 0.12, "triangle"],
    ] as [number, number, OscillatorType][]) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = type;
      o.frequency.value = f0 * mul;
      og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
  }

  /** 背景环境：远处电报房持续的滴滴答答（低音量、随机节奏） */
  private tickTimer: ReturnType<typeof setTimeout> | null = null;
  private tickOn = false;
  startTicker() {
    this.ensure();
    if (this.tickOn) return;
    this.tickOn = true;
    // 真实电码节奏：字符内符号间隔 1 单位，字符间 3 单位，词间 7 单位
    const UNIT = 70;
    const CODES = [
      ".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....",
      "..", ".---", "-.-", ".-..", "--", "-.", "---", ".--.",
      "..-", "...", "-", "...-", ".--", "-..-", "-.--", "--..",
    ];
    const schedule = () => {
      if (!this.tickOn) return;
      // 随机发一「词」（2~5 个字符）
      const nChars = 2 + Math.floor(Math.random() * 4);
      let at = 0;
      for (let ci = 0; ci < nChars; ci++) {
        const code = CODES[Math.floor(Math.random() * CODES.length)];
        for (const sym of code) {
          const long = sym === "-";
          const delay = at;
          setTimeout(() => { if (this.tickOn) this.key(long, 0.22); }, delay);
          at += (long ? 3 : 1) * UNIT + UNIT;      // 符号时长 + 符号间隔
        }
        at += 2 * UNIT;                            // 字符间隔（共 3 单位）
      }
      this.tickTimer = setTimeout(schedule, at + 500 + Math.random() * 1800);
    };
    this.tickTimer = setTimeout(schedule, 500);
  }

  stopTicker() {
    this.tickOn = false;
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
  }
  /** 发报：一串真实摩斯（含电键与继电器咔哒） */
  morse(msg = "SOS") {
    if (!this.ctx) return;
    const TABLE: Record<string, string> = {
      S: "...", O: "---", H: "....", E: ".", L: ".-..", P: ".--.", A: ".-", M: "--",
    };
    let t = 0;
    for (const ch of msg.toUpperCase()) {
      const code = TABLE[ch] ?? "...";
      for (const c of code) {
        const long = c === "-";
        setTimeout(() => this.key(long), t * 1000);
        t += (long ? 0.18 : 0.08) + 0.06;
      }
      t += 0.14;
    }
  }
  /** 电报回电：音响器急促连打 + 纸带走动 */
  relay() {
    // 回电："R" (.-.) "OK" (--- -.-)：清脆的滴答流
    const stream = ".-. --- -.-";
    let at = 0;
    for (const sym of stream) {
      if (sym === " ") { at += 140; continue; }
      const long = sym === "-";
      const d = at;
      setTimeout(() => this.key(long, 0.9), d);
      at += (long ? 210 : 95) + 70;
    }
    setTimeout(() => this.noise(0.5, 2600, 0.06, "bandpass", 0.2, 2), 200); // 纸带走动
  }
  arrive() {
    this.noise(0.1, 1200, 0.2, "lowpass", 0.3);         // 箱体落地
    this.tone(392, 0.12, "triangle", 0.1);
    setTimeout(() => this.tone(523, 0.18, "triangle", 0.1), 110);
  }
  pickup() { this.noise(0.05, 3200, 0.12, "bandpass", 0, 5); this.tone(880, 0.07, "triangle", 0.09, 1200); }
  /** 敌方对讲机：窄带squelch噪声 + 人声感滤波 */
  walkie() {
    this.noise(0.05, 1800, 0.18, "bandpass", 0.2, 8);
    setTimeout(() => {
      this.noise(0.26, 1400, 0.1, "bandpass", 0.2, 3);
      this.tone(420, 0.1, "sawtooth", 0.04);
      this.tone(380, 0.12, "sawtooth", 0.035);
    }, 70);
    setTimeout(() => this.noise(0.06, 2200, 0.14, "bandpass", 0.2, 9), 340);
  }

  // ============================================================
  // 结局 / 演出
  // ============================================================
  /** 下课铃：真实电铃（锤击 + 金属腔体共鸣） */
  bell() {
    if (!this.ctx) return;
    const strike = (delay: number) => {
      setTimeout(() => {
        [1046, 1572, 2093, 2670, 3140].forEach((f, i) => {
          this.tone(f, 1.6 - i * 0.2, i < 2 ? "sine" : "triangle", 0.16 / (i + 1), 0, 0.6);
        });
        this.noise(0.04, 6000, 0.12, "highpass");
      }, delay);
    };
    for (let i = 0; i < 10; i++) strike(i * 150);
  }
  win() {
    // 胜利号角（铜管齐鸣，大调三和弦）
    const chord = [261.6, 329.6, 392, 523.3];
    chord.forEach((f, i) => setTimeout(() => {
      this.tone(f, 1.6, "sawtooth", 0.1, 0, 0.5);
      this.tone(f * 0.5, 1.6, "square", 0.05, 0, 0.4);
    }, i * 90));
    setTimeout(() => this.snare(0.3), 400);
  }
  lose() {
    // 悲凉下行（小调）
    [392, 349.2, 311.1, 233.1].forEach((f, i) =>
      setTimeout(() => {
        this.tone(f, 1.1, "sawtooth", 0.1, 0, 0.6);
        this.tone(f / 2, 1.3, "triangle", 0.08, 0, 0.5);
      }, i * 380)
    );
  }
  /** 军鼓 */
  snare(gain = 0.2) {
    this.noise(0.09, 2200, gain, "bandpass", 0.25, 1.2);
    this.noise(0.16, 900, gain * 0.5, "highpass", 0.2);
    this.tone(220, 0.05, "triangle", gain * 0.3, 150);
  }
  /** 定音鼓 / 战鼓 */
  thump(gain = 0.5) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.34);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g).connect(this.master);
    const sg = this.ctx.createGain(); sg.gain.value = 0.5;
    g.connect(sg).connect(this.out(1));
    o.start(t); o.stop(t + 0.44);
    this.noise(0.1, 420, gain * 0.4, "lowpass", 0.4);
  }
  /** 铜管强音（悲壮） */
  sting() {
    const chord = [174.6, 207.7, 261.6, 349.2]; // f 小调
    chord.forEach((f, i) => setTimeout(() => {
      this.tone(f, 2.0, "sawtooth", 0.1, 0, 0.7, i * 4);
      this.tone(f * 2, 1.6, "square", 0.04, 0, 0.5);
    }, i * 70));
    this.thump(0.55);
    setTimeout(() => this.thump(0.4), 420);
  }
  wind() { this.noise(3.0, 420, 0.1, "lowpass", 0.6, 0.6, 200); }
  crash() { this.noise(0.6, 3200, 0.34, "highpass", 0.6); this.noise(0.5, 500, 0.3, "lowpass", 0.5); this.tone(140, 0.4, "square", 0.16, 50); }

  // ============================================================
  // 载具：边三轮摩托
  // ============================================================
  engineStart() {
    if (!this.ctx || !this.master || this.engineNodes || !this.noiseBuf) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.2, t, 0.3);
    g.connect(this.master);
    const filt = this.ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 520; filt.Q.value = 3;
    filt.connect(g);
    // 单缸爆震基频
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth"; osc.frequency.value = 46;
    osc.connect(filt);
    const sub = this.ctx.createOscillator();
    sub.type = "square"; sub.frequency.value = 23;
    const subG = this.ctx.createGain(); subG.gain.value = 0.5;
    sub.connect(subG).connect(filt);
    // 排气噪声
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true; src.playbackRate.value = 0.7;
    const nf = this.ctx.createBiquadFilter();
    nf.type = "bandpass"; nf.frequency.value = 300; nf.Q.value = 1.2;
    const ng = this.ctx.createGain(); ng.gain.value = 0.45;
    src.connect(nf).connect(ng).connect(filt);
    osc.start(); sub.start(); src.start();
    // 启动咳嗽
    this.noise(0.5, 900, 0.3, "lowpass", 0.3, 1, 200);
    this.engineNodes = { osc, sub, src, gain: g, filt };
  }
  /** 0..1 油门 */
  engineThrottle(v: number) {
    if (!this.ctx || !this.engineNodes) return;
    const t = this.ctx.currentTime;
    this.engineNodes.osc.frequency.setTargetAtTime(44 + v * 90, t, 0.1);
    this.engineNodes.sub.frequency.setTargetAtTime(22 + v * 44, t, 0.1);
    this.engineNodes.filt.frequency.setTargetAtTime(460 + v * 1500, t, 0.12);
    this.engineNodes.gain.gain.setTargetAtTime(0.16 + v * 0.14, t, 0.12);
  }
  engineStop() {
    if (!this.ctx || !this.engineNodes) return;
    const { osc, sub, src, gain } = this.engineNodes;
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
    setTimeout(() => { try { osc.stop(); sub.stop(); src.stop(); } catch { /* noop */ } }, 500);
    this.engineNodes = null;
  }
  skid() { this.noise(0.6, 1800, 0.22, "bandpass", 0.3, 2.4, 700); }
  /** 厕所门闩 */
  lockDoor() {
    this.noise(0.05, 2600, 0.24, "bandpass", 0.5, 6);
    setTimeout(() => { this.noise(0.08, 900, 0.3, "lowpass", 0.6); this.tone(150, 0.1, "square", 0.14, 80); }, 90);
    setTimeout(() => this.noise(0.03, 4200, 0.18, "highpass", 0.5), 190);
  }
  bang() { // 砸门
    this.noise(0.22, 200, 0.5, "lowpass", 0.8);
    this.tone(62, 0.34, "sine", 0.4, 32, 0.6);
    this.noise(0.1, 1600, 0.14, "bandpass", 0.5, 2);
  }
  drip() { this.tone(1400, 0.05, "sine", 0.08, 700, 0.9); }

  // ============================================================
  // 管弦配乐引擎（前瞻调度 · 多段曲式 · 不断发展不原地循环）
  //   prep   备战：紧张、压抑、心跳般的固定音型，层层加码
  //   battle 战斗：雄壮军乐进行曲，四段主题轮替 + 转调
  //   flag   升旗：缓慢、庄严、略带悲凉的军号挽歌
  //   epic   驰援：史诗级全奏，人声、铜管八度、太鼓、升key
  // ============================================================

  private mGain: GainNode | null = null;
  private mTimer: ReturnType<typeof setInterval> | null = null;
  private mStep = 0;
  private mNext = 0;
  private mStepDur = 0.15;
  private mMode: BgmMode | "none" = "none";
  private mKey = 0;          // 当前移调（半音）
  private mCycle = 0;        // 已完成的曲式轮次

  /** MIDI -> Hz */
  private hz(m: number) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- 配器声部（均为绝对时间调度） ----------
  /** 铜管：锯齿堆叠 + 低通包络，强力有芯 */
  private vBrass(at: number, midi: number, dur: number, amp: number) {
    if (!this.ctx || !this.mGain) return;
    const f = this.hz(midi + this.mKey);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(600, at);
    lp.frequency.linearRampToValueAtTime(2600 + amp * 2600, at + 0.06);
    lp.frequency.linearRampToValueAtTime(1500, at + dur);
    lp.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + 0.035);         // 铜管缓起
    g.gain.setValueAtTime(amp, at + Math.max(0.05, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    lp.connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.5;
    g.connect(rv).connect(this.out(1));
    for (const [mul, det, a] of [[1, -8, 1], [1, 9, 0.9], [2, 3, 0.3], [0.5, 0, 0.35]] as [number, number, number][]) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = f * mul;
      o.detune.value = det;
      og.gain.value = a;
      o.connect(og).connect(lp);
      o.start(at); o.stop(at + dur + 0.05);
    }
  }

  /** 弦乐：柔起长音 / 也可做短促断奏 */
  private vStrings(at: number, midi: number, dur: number, amp: number, stac = false) {
    if (!this.ctx || !this.mGain) return;
    const f = this.hz(midi + this.mKey);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = stac ? 1800 : 1200 + amp * 1800;
    const g = this.ctx.createGain();
    const atk = stac ? 0.008 : Math.min(0.3, dur * 0.35);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    lp.connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = stac ? 0.3 : 0.6;
    g.connect(rv).connect(this.out(1));
    for (const det of [-11, 7]) {
      const o = this.ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(at); o.stop(at + dur + 0.05);
    }
  }

  /** 低音声部：大号 / 低音提琴 */
  private vBass(at: number, midi: number, dur: number, amp: number) {
    if (!this.ctx || !this.mGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 520;
    o.type = "sawtooth";
    o.frequency.value = this.hz(midi + this.mKey);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(lp).connect(g).connect(this.mGain);
    o.start(at); o.stop(at + dur + 0.04);
  }

  /** 人声合唱垫：史诗感 */
  private vChoir(at: number, midi: number, dur: number, amp: number) {
    if (!this.ctx || !this.mGain) return;
    const f = this.hz(midi + this.mKey);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = f * 2.2; bp.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    bp.connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.8;
    g.connect(rv).connect(this.out(1));
    for (const [mul, type, a] of [[1, "triangle", 1], [1.002, "sine", 0.7], [2, "sine", 0.22]] as [number, OscillatorType, number][]) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = type; o.frequency.value = f * mul; og.gain.value = a;
      o.connect(og).connect(bp);
      o.start(at); o.stop(at + dur + 0.06);
    }
  }

  /** 定音鼓 */
  private vTimp(at: number, midi: number, amp: number) {
    if (!this.ctx || !this.mGain) return;
    const f = this.hz(midi + this.mKey);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f * 1.6, at);
    o.frequency.exponentialRampToValueAtTime(f * 0.85, at + 0.14);
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.55;
    g.connect(rv).connect(this.out(1));
    o.start(at); o.stop(at + 0.55);
    // 鼓皮噪声
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource();
      n.buffer = this.noiseBuf; n.playbackRate.value = 0.5;
      const nf = this.ctx.createBiquadFilter();
      nf.type = "lowpass"; nf.frequency.value = 320;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(amp * 0.5, at);
      ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
      n.connect(nf).connect(ng).connect(this.mGain);
      n.start(at); n.stop(at + 0.16);
    }
  }

  /** 太鼓（史诗段） */
  private vTaiko(at: number, amp: number) {
    if (!this.ctx || !this.mGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(128, at);
    o.frequency.exponentialRampToValueAtTime(38, at + 0.26);
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.7;
    g.connect(rv).connect(this.out(1));
    o.start(at); o.stop(at + 0.55);
    if (this.noiseBuf) {
      const n = this.ctx.createBufferSource();
      n.buffer = this.noiseBuf; n.playbackRate.value = 0.35;
      const nf = this.ctx.createBiquadFilter();
      nf.type = "lowpass"; nf.frequency.value = 220;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(amp * 0.7, at);
      ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      n.connect(nf).connect(ng).connect(this.mGain);
      n.start(at); n.stop(at + 0.22);
    }
  }

  /** 军鼓 */
  private vSnare(at: number, amp: number, bright = 2400) {
    if (!this.ctx || !this.mGain || !this.noiseBuf) return;
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf; n.playbackRate.value = 1.5;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = bright; f.Q.value = 1.1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.075);
    n.connect(f).connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.3;
    g.connect(rv).connect(this.out(1));
    n.start(at); n.stop(at + 0.09);
  }

  /** 镲 / 锣 */
  private vCym(at: number, amp: number, dur = 1.4) {
    if (!this.ctx || !this.mGain || !this.noiseBuf) return;
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf; n.playbackRate.value = 2.0;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = 4600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    n.connect(f).connect(g).connect(this.mGain);
    const rv = this.ctx.createGain(); rv.gain.value = 0.7;
    g.connect(rv).connect(this.out(1));
    n.start(at); n.stop(at + dur + 0.05);
  }

  /** 极轻的心跳/机械滴答（备战段） */
  private vTick(at: number, amp: number) {
    if (!this.ctx || !this.mGain || !this.noiseBuf) return;
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf; n.playbackRate.value = 1.9;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 5200; f.Q.value = 8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    n.connect(f).connect(g).connect(this.mGain);
    n.start(at); n.stop(at + 0.05);
  }

  // ============================================================
  // 曲式数据（MIDI 音高；-1 = 休止，-2 = 延音保持）
  // ============================================================

  /** 备战：D 小调，不安的固定音型，四段递进 */
  private static PREP = {
    stepDur: 0.1364,                   // 110bpm 的 16 分
    sectionBars: 4,
    sections: 6,
    // 低音固定音型（每 16 分一格，一小节 16 格）
    ost: [38, -1, 38, -1, 39, -1, 38, -1, 36, -1, 38, -1, 39, -1, 41, -1],
    // 各段高声部动机（每段 2 小节 = 32 格，取 8 分网格 16 个值）
    motifs: [
      [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [62, -1, -1, -1, 63, -1, -1, -1, 65, -1, -1, -1, 62, -1, -1, -1],
      [69, -1, 68, -1, 65, -1, -1, -1, 63, -1, 62, -1, -1, -1, -1, -1],
      [74, -1, -1, 72, -1, 70, -1, -1, 69, -1, -1, 68, -1, -1, 65, -1],
      [62, 65, 69, 72, -1, 70, -1, 69, 68, -1, 65, -1, 63, -1, 62, -1],
      [77, -1, -1, -1, 75, -1, 74, -1, 72, -1, -1, -1, 69, -1, -1, -1],
    ],
  };

  /** 战斗：D 小调进行曲，A-A'-B-C 四段主题各 8 小节 */
  private static BATTLE = {
    stepDur: 0.1339,                   // 112bpm 的 16 分
    // 每段 8 小节 × 16 格 = 128 格；此处以 8 分音符（64 格）书写后展开
    themes: [
      // A：号角主题（坚定）
      [62, -1, 62, -1, 65, -1, 69, -1, 67, -1, 65, -1, 62, -1, -1, -1,
       60, -1, 60, -1, 63, -1, 67, -1, 65, -1, 63, -1, 60, -1, -1, -1,
       62, -1, 65, -1, 69, -1, 74, -1, 72, -1, 70, -1, 69, -1, 67, -1,
       65, -1, -1, 63, -1, 62, -1, -1, 62, -1, -1, -1, -1, -1, -1, -1],
      // A'：同主题高八度变奏 + 附点
      [74, -1, 74, 72, 70, -1, 69, -1, 67, -1, 65, -1, 62, -1, 65, -1,
       72, -1, 72, 70, 68, -1, 67, -1, 65, -1, 63, -1, 60, -1, 63, -1,
       74, -1, 77, -1, 81, -1, 79, -1, 77, -1, 74, -1, 72, -1, 70, -1,
       69, -1, -1, 67, -1, 65, -1, -1, 62, -1, -1, -1, -1, -1, -1, -1],
      // B：悲凉的中段（关系大调转回小调）
      [65, -1, -1, -1, 67, -1, 69, -1, 70, -1, -1, -1, 69, -1, 67, -1,
       65, -1, -1, -1, 63, -1, 62, -1, 60, -1, -1, -1, -1, -1, -1, -1,
       63, -1, -1, -1, 65, -1, 67, -1, 68, -1, -1, -1, 67, -1, 65, -1,
       63, -1, 62, -1, 60, -1, 58, -1, 57, -1, -1, -1, -1, -1, -1, -1],
      // C：高潮（上行推进）
      [69, -1, 70, -1, 72, -1, 74, -1, 75, -1, -1, 74, -1, 72, -1, 70,
       69, -1, 72, -1, 74, -1, 77, -1, 79, -1, -1, 77, -1, 74, -1, 72,
       81, -1, -1, 79, -1, 77, -1, -1, 74, -1, 77, -1, 81, -1, 84, -1,
       82, -1, -1, 81, -1, 79, -1, 77, 74, -1, -1, -1, -1, -1, -1, -1],
    ],
    // 每段 8 小节的根音走向
    roots: [
      [38, 38, 41, 41, 36, 36, 33, 45],
      [38, 38, 41, 41, 36, 36, 45, 38],
      [41, 41, 36, 36, 34, 34, 33, 33],
      [38, 41, 43, 45, 38, 41, 45, 38],
    ],
  };

  /** 升旗：缓慢的军号挽歌（略带悲凉），4 个乐句不重复 */
  private static FLAG = {
    stepDur: 0.2273,                   // 66bpm 的 16 分
    // 4 乐句 × 4 小节 × 16 格，8 分网格书写（32 格/乐句）
    phrases: [
      [62, -1, -1, -1, 65, -1, -1, -1, 69, -1, -1, -1, -1, -1, -1, -1,
       67, -1, -1, 65, -1, -1, -1, -1, 62, -1, -1, -1, -1, -1, -1, -1],
      [65, -1, -1, -1, 69, -1, -1, -1, 72, -1, -1, -1, 70, -1, -1, -1,
       69, -1, -1, 67, -1, 65, -1, -1, 64, -1, -1, -1, -1, -1, -1, -1],
      [74, -1, -1, -1, 72, -1, -1, 70, -1, -1, 69, -1, -1, -1, -1, -1,
       67, -1, 65, -1, -1, -1, 63, -1, 62, -1, -1, -1, -1, -1, -1, -1],
      [69, -1, -1, -1, 70, -1, -1, -1, 69, -1, 67, -1, 65, -1, -1, -1,
       62, -1, -1, -1, 61, -1, -1, -1, 62, -1, -1, -1, -1, -1, -1, -1],
    ],
    chords: [
      [38, 45, 50, 53], [41, 48, 53, 57], [36, 43, 48, 52], [38, 45, 50, 57],
      [41, 48, 53, 57], [34, 41, 46, 50], [38, 45, 50, 53], [33, 45, 49, 52],
    ],
  };

  /** 驰援：史诗全奏，Em→G 大气推进，5 段结构 + 升 key */
  private static EPIC = {
    stepDur: 0.1136,                   // 132bpm 的 16 分
    themes: [
      // 1 建立（弦乐固定音型为主，旋律稀疏）
      [-1, -1, -1, -1, -1, -1, -1, -1, 64, -1, -1, -1, 67, -1, -1, -1,
       71, -1, -1, -1, -1, -1, -1, -1, 69, -1, -1, -1, 67, -1, -1, -1],
      // 2 主题首次呈现（铜管）
      [71, -1, -1, 72, -1, 74, -1, -1, 71, -1, -1, -1, 67, -1, -1, -1,
       69, -1, -1, 71, -1, 72, -1, -1, 69, -1, -1, -1, -1, -1, -1, -1],
      // 3 主题加厚（+人声）
      [76, -1, -1, 74, -1, 72, -1, 71, 72, -1, 74, -1, 76, -1, -1, -1,
       79, -1, -1, 78, -1, 76, -1, 74, 72, -1, -1, -1, 71, -1, -1, -1],
      // 4 高潮（八度齐奏）
      [83, -1, 81, -1, 79, -1, 78, -1, 76, -1, -1, 74, -1, 72, -1, 71,
       72, -1, 74, -1, 76, -1, 79, -1, 83, -1, -1, -1, -1, -1, -1, -1],
      // 5 凯旋收束
      [79, -1, -1, -1, 83, -1, -1, -1, 86, -1, -1, -1, -1, -1, 84, -1,
       83, -1, -1, 81, -1, 79, -1, -1, 76, -1, -1, -1, -1, -1, -1, -1],
    ],
    roots: [
      [40, 40, 43, 43], [45, 45, 38, 38], [40, 43, 45, 47],
      [48, 47, 45, 43], [40, 45, 43, 40],
    ],
  };

  // ============================================================
  startBgm(mode: BgmMode | "march" | "siege" = "battle") {
    this.ensure();
    if (!this.ctx || !this.master) return;
    const m: BgmMode =
      mode === "march" ? "battle" : mode === "siege" ? "prep" : (mode as BgmMode);
    if (this.mMode === m && this.mTimer) return;
    this.stopBgm();
    this.mMode = m;
    this.mStep = 0;
    this.mCycle = 0;
    this.mKey = 0;

    const cfg = m === "prep" ? SFX.PREP : m === "battle" ? SFX.BATTLE : m === "flag" ? SFX.FLAG : SFX.EPIC;
    this.mStepDur = cfg.stepDur;

    this.mGain = this.ctx.createGain();
    this.mGain.gain.value = 0.0001;
    const target = m === "epic" ? 0.72 : m === "flag" ? 0.5 : m === "prep" ? 0.44 : 0.6;
    this.mGain.gain.setTargetAtTime(target, this.ctx.currentTime, m === "flag" ? 1.6 : 0.8);
    this.mGain.connect(this.master);
    const rev = this.ctx.createGain();
    rev.gain.value = m === "flag" ? 0.65 : m === "epic" ? 0.55 : 0.4;
    this.mGain.connect(rev).connect(this.out(1));

    this.mNext = this.ctx.currentTime + 0.1;
    // 前瞻调度：每 25ms 预排 200ms 内的音符 → 节奏精准不抖动
    this.mTimer = setInterval(() => {
      if (!this.ctx) return;
      while (this.mNext < this.ctx.currentTime + 0.2) {
        this.schedule(this.mStep, this.mNext);
        this.mNext += this.mStepDur;
        this.mStep++;
      }
    }, 25);
  }

  /** 按模式排布每一个 16 分格 */
  private schedule(step: number, at: number) {
    switch (this.mMode) {
      case "prep": return this.schedPrep(step, at);
      case "battle": return this.schedBattle(step, at);
      case "flag": return this.schedFlag(step, at);
      case "epic": return this.schedEpic(step, at);
    }
  }

  // ---------- 备战：紧张感层层加压 ----------
  private schedPrep(step: number, at: number) {
    const C = SFX.PREP;
    const barLen = 16;
    const secLen = barLen * C.sectionBars;              // 一段 = 4 小节
    const sec = Math.floor(step / secLen) % C.sections;
    const inSec = step % secLen;
    const inBar = step % barLen;
    const bar = Math.floor(inSec / barLen);
    const intensity = sec / (C.sections - 1);           // 0..1 张力

    // 整段轮完一轮 → 转调上行，制造持续不安
    if (step > 0 && step % (secLen * C.sections) === 0) {
      this.mCycle++;
      this.mKey = [0, 2, 3, 5][this.mCycle % 4];
    }

    // 低音固定音型（始终推进）
    const on = C.ost[inBar];
    if (on > 0) this.vBass(at, on, 0.16, 0.17 + intensity * 0.07);

    // 机械滴答：16 分（越到后面越密）
    if (inBar % 4 === 0 || (intensity > 0.4 && inBar % 2 === 0)) {
      this.vTick(at, 0.05 + intensity * 0.05);
    }

    // 心跳定音鼓：每小节 1、3 拍
    if (inBar === 0 || inBar === 8) this.vTimp(at, 38, 0.2 + intensity * 0.16);
    if (intensity > 0.5 && inBar === 11) this.vTimp(at, 36, 0.12);

    // 高声部动机（8 分网格）
    if (inBar % 2 === 0) {
      const mi = ((bar % 2) * 8 + inBar / 2) % 16;
      const n = C.motifs[sec][mi];
      if (n > 0) this.vStrings(at, n, 0.5 + intensity * 0.5, 0.06 + intensity * 0.05);
    }

    // 持续弦乐铺底（每 2 小节换和声）
    if (inBar === 0 && bar % 2 === 0) {
      const pad = [[38, 45, 53], [36, 43, 51], [41, 48, 53], [34, 41, 50]][(sec + bar) % 4];
      for (const n of pad) this.vStrings(at, n + 12, this.mStepDur * 32, 0.035 + intensity * 0.025);
    }

    // 后段加入军鼓滚奏与铜管重音
    if (intensity > 0.6) {
      if (inBar % 4 === 2) this.vSnare(at, 0.05 + intensity * 0.05, 2800);
      if (bar === 3 && inBar >= 12) this.vSnare(at, 0.06 + (inBar - 12) * 0.025);
    }
    if (intensity > 0.75 && inSec === 0) {
      this.vBrass(at, 50, 0.5, 0.1);
      this.vCym(at, 0.06, 1.0);
    }
  }

  // ---------- 战斗：雄壮进行曲，四主题轮替 ----------
  private schedBattle(step: number, at: number) {
    const C = SFX.BATTLE;
    const barLen = 16;
    const themeLen = barLen * 8;                        // 每主题 8 小节
    const themeIdx = Math.floor(step / themeLen) % C.themes.length;
    const inTheme = step % themeLen;
    const inBar = step % barLen;
    const bar = Math.floor(inTheme / barLen);

    // 一轮四主题走完 → 转调（D→E→F→D…）保持新鲜
    if (step > 0 && step % (themeLen * C.themes.length) === 0) {
      this.mCycle++;
      this.mKey = [0, 2, 3, -2][this.mCycle % 4];
    }

    const mel = C.themes[themeIdx];
    const roots = C.roots[themeIdx];
    const root = roots[bar];
    const isClimax = themeIdx === 3;
    const isSoft = themeIdx === 2;

    // --- 旋律（8 分网格） ---
    if (inBar % 2 === 0) {
      const mi = bar * 8 + inBar / 2;
      const n = mel[mi % mel.length];
      if (n > 0) {
        const dur = this.mStepDur * (isSoft ? 3.4 : 2.6);
        if (isSoft) {
          this.vStrings(at, n, dur * 1.3, 0.085);
          this.vBrass(at, n - 12, dur, 0.05);
        } else {
          this.vBrass(at, n, dur, isClimax ? 0.13 : 0.105);
          if (isClimax) this.vBrass(at, n - 12, dur, 0.06);     // 八度加厚
          if (themeIdx === 1) this.vStrings(at, n + 12, dur, 0.03);
        }
      }
    }

    // --- 低音 / 和声 ---
    if (inBar % 4 === 0) this.vBass(at, root, this.mStepDur * 3.4, 0.2);
    if (inBar % 4 === 2 && !isSoft) this.vBass(at, root + 7, this.mStepDur * 2.4, 0.12);
    // 内声部和弦断奏（进行曲的「后半拍」）
    if (inBar % 4 === 2 || (!isSoft && inBar % 4 === 0 && bar % 2 === 1)) {
      for (const iv of [3, 7, 12]) this.vStrings(at, root + 12 + iv, 0.12, 0.035, true);
    }

    // --- 打击乐：标准军乐节奏 + 每 4 小节一次过门 ---
    const fill = bar % 4 === 3;
    const pat = isSoft
      ? [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0]
      : [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0];
    if (pat[inBar]) this.vSnare(at, inBar === 0 ? 0.14 : 0.08);
    if (fill && inBar >= 12) this.vSnare(at, 0.07 + (inBar - 12) * 0.03);
    if (inBar === 0) this.vTimp(at, root, isClimax ? 0.4 : 0.3);
    if (inBar === 8) this.vTimp(at, root + 7, 0.22);
    if (inTheme === 0) this.vCym(at, isClimax ? 0.14 : 0.08, 1.5);
  }

  // ---------- 升旗：缓慢庄严、略带悲凉 ----------
  private schedFlag(step: number, at: number) {
    const C = SFX.FLAG;
    const barLen = 16;
    const phLen = barLen * 4;                       // 每乐句 4 小节
    const ph = Math.floor(step / phLen) % C.phrases.length;
    const inPh = step % phLen;
    const inBar = step % barLen;
    const bar = Math.floor(step / barLen);

    // 四乐句走完 → 下移小三度再现，愈发苍凉
    if (step > 0 && step % (phLen * C.phrases.length) === 0) {
      this.mCycle++;
      this.mKey = [0, -3, -5, -3][this.mCycle % 4];
    }

    // 独奏军号（8 分网格）
    if (inBar % 2 === 0) {
      const mi = (Math.floor(inPh / barLen) * 8 + inBar / 2) % 32;
      const n = C.phrases[ph][mi];
      if (n > 0) {
        this.vBrass(at, n, this.mStepDur * 7, 0.12);     // 长音、呼吸感
        this.vStrings(at, n - 12, this.mStepDur * 8, 0.03);
      }
    }

    // 弦乐和声垫：每小节换一个和弦
    if (inBar === 0) {
      const ch = C.chords[bar % C.chords.length];
      ch.forEach((n, i) => this.vStrings(at, n + (i === 0 ? 0 : 12), this.mStepDur * 17, 0.05 - i * 0.006));
      // 远处的低沉鼓
      if (bar % 2 === 0) this.vTimp(at, ch[0], 0.18);
    }
    // 极弱的军鼓滚（像远方的队列）
    if (inBar % 8 === 6) this.vSnare(at, 0.03, 2000);
    // 乐句起始的锣
    if (inPh === 0 && ph % 2 === 0) this.vCym(at, 0.05, 2.2);
  }

  // ---------- 驰援：史诗全奏 ----------
  private schedEpic(step: number, at: number) {
    const C = SFX.EPIC;
    const barLen = 16;
    const secLen = barLen * 4;                      // 每段 4 小节
    const sec = Math.floor(step / secLen) % C.themes.length;
    const inSec = step % secLen;
    const inBar = step % barLen;
    const bar = Math.floor(inSec / barLen);
    const root = C.roots[sec][bar];
    const big = sec >= 2;

    // 每轮结束升 key，推向更high
    if (step > 0 && step % (secLen * C.themes.length) === 0) {
      this.mCycle++;
      this.mKey = [0, 2, 4, 5][this.mCycle % 4];
    }

    // --- 弦乐 16 分固定音型（史诗驱动力） ---
    const ostPattern = [0, 7, 12, 7, 3, 7, 12, 7, 0, 7, 12, 7, 3, 7, 12, 7];
    if (sec >= 0) {
      this.vStrings(at, root + 12 + ostPattern[inBar], this.mStepDur * 1.1, big ? 0.045 : 0.03, true);
    }

    // --- 主旋律（8 分网格），高潮段八度齐奏 ---
    if (inBar % 2 === 0) {
      const mi = (bar * 8 + inBar / 2) % 32;
      const n = C.themes[sec][mi];
      if (n > 0) {
        const dur = this.mStepDur * 3;
        this.vBrass(at, n, dur, big ? 0.13 : 0.1);
        if (big) {
          this.vBrass(at, n - 12, dur, 0.075);
          this.vChoir(at, n, dur * 1.4, 0.055);
        }
        if (sec >= 3) this.vBrass(at, n + 12, dur, 0.05);
      }
    }

    // --- 人声/铜管和声垫 ---
    if (inBar === 0) {
      const triad = [root, root + 7, root + 12, root + 16];
      triad.forEach((n, i) => this.vChoir(at, n + 12, this.mStepDur * 15, (big ? 0.05 : 0.03) - i * 0.005));
      this.vBass(at, root - 12, this.mStepDur * 14, 0.22);
    }
    if (inBar === 8) this.vBass(at, root - 5, this.mStepDur * 6, 0.14);

    // --- 打击：太鼓 + 军鼓 + 镲 ---
    const taiko = [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    if (taiko[inBar]) this.vTaiko(at, inBar === 0 ? 0.5 : 0.3);
    if (big) {
      const sn = [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1];
      if (sn[inBar]) this.vSnare(at, 0.07);
    }
    if (bar === 3 && inBar >= 10) this.vSnare(at, 0.06 + (inBar - 10) * 0.022);   // 过门推进
    if (inSec === 0) this.vCym(at, big ? 0.16 : 0.09, 2.0);
    if (sec === 4 && inSec === 0) this.vCym(at, 0.2, 3.0);                        // 凯旋大镲
  }

  stopBgm() {
    if (this.mTimer) { clearInterval(this.mTimer); this.mTimer = null; }
    if (this.mGain && this.ctx) {
      const g = this.mGain;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => { try { g.disconnect(); } catch { /* noop */ } }, 1400);
      this.mGain = null;
    }
    this.mMode = "none";
  }

  stopAllLoops() {
    this.flameStop();
    this.laserStop();
    this.engineStop();
    this.stopTicker();
  }
}

export const sfx = new SFX();
