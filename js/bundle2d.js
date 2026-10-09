/**
 * El Despertar de Vigirima
 * Versión final limpia - Zona 3 con Búsqueda Nocturna
 */
(function () {
  "use strict";

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.unlocked = false;
      this.lastStep = 0;
    }
    unlock() {
      if (this.unlocked) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.unlocked = true;
      } catch (e) {}
    }
    resume() {
      this.unlock();
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
    play(freq, type, duration, volume = 0.18) {
      if (this.muted || !this.ctx) return;
      this.resume();
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.05);
      } catch (e) {}
    }
    footstep() {
      const now = performance.now();
      if (now - this.lastStep < 280) return;
      this.lastStep = now;
      this.play(55 + Math.random() * 25, "sine", 0.09, 0.08);
    }
    bookOpen() { this.play(280, "triangle", 0.4, 0.16); setTimeout(() => this.play(420, "sine", 0.5, 0.11), 200); }
    drag() { this.play(90, "sawtooth", 0.12, 0.12); }
    snap() { this.play(220, "triangle", 0.18, 0.25); this.play(660, "sine", 0.35, 0.12); }
    success() { [262,330,392,523].forEach((f,i)=>setTimeout(()=>this.play(f,"triangle",0.5,0.14),i*90)); }
    error() { this.play(110, "sine", 0.35, 0.22); this.play(70, "sawtooth", 0.4, 0.16); }
    spiritRoar() {
      this.play(50, "sawtooth", 0.8, 0.32);
      this.play(80, "sine", 0.6, 0.22);
      this.play(35, "triangle", 0.9, 0.15);
    }
    water() { [440,554,659].forEach((f,i)=>setTimeout(()=>this.play(f,"sine",0.55,0.1),i*120)); }
    find() { this.play(520, "sine", 0.3, 0.2); this.play(780, "triangle", 0.4, 0.15); }
    victory() { [392,440,523,587,659,784].forEach((f,i)=>setTimeout(()=>this.play(f,"triangle",0.5,0.16),i*170)); }
  }
  const sound = new SoundEngine();

  class VigirimaWorld {
    constructor() {
      this.player = { x: 280, targetX: 280, vx: 0, speed: 5.2, dir: 1 };
      this.cam = { x: 0 };
      this.worldWidth = 4200;
      this.keys = {};
      this.state = {
        introDone: false,
        z1: false,
        z2: false,
        z3: false,
        z1Count: 0,
        z2Placed: 0,
        caveActive: false
      };
      this.dom = {};
    }

    init() {
      this.cacheDOM();
      this.bindEvents();
      this.startIntro();
      this.initStars();
      this.initZone1();
      this.initZone2();
      this.gameLoop();
    }

    cacheDOM() {
      this.dom.intro = document.getElementById("cinematic-intro");
      this.dom.world = document.getElementById("game-world-container");
      this.dom.stage = document.getElementById("world-stage");
      this.dom.player = document.getElementById("player-avatar");
      this.dom.toast = document.getElementById("clue-toast");
      this.dom.toastTitle = document.getElementById("toast-title");
      this.dom.toastText = document.getElementById("clue-toast-text");
      this.dom.path12 = document.getElementById("path-zone1-to-2");
      this.dom.path23 = document.getElementById("path-zone2-to-3");
      this.dom.victory = document.getElementById("victory-modal");
      this.dom.muteBtn = document.getElementById("mute-btn");
    }

    bindEvents() {
      const unlock = () => { sound.unlock(); sound.resume(); };
      ["click", "touchstart", "keydown"].forEach(evt => window.addEventListener(evt, unlock));

      window.addEventListener("keydown", e => {
        if (this.state.caveActive) return;
        if (["ArrowLeft","a","A"].includes(e.key)) { this.keys.left = true; this.player.targetX = null; }
        if (["ArrowRight","d","D"].includes(e.key)) { this.keys.right = true; this.player.targetX = null; }
      });
      window.addEventListener("keyup", e => {
        if (["ArrowLeft","a","A"].includes(e.key)) this.keys.left = false;
        if (["ArrowRight","d","D"].includes(e.key)) this.keys.right = false;
      });

      this.dom.stage.addEventListener("click", e => {
        if (!this.state.introDone || this.state.caveActive) return;
        if (e.target.closest(".stone-piece, .order-card, .hud-btn, #btn-enter-cave, .enter-cave-btn")) return;
        const rect = this.dom.stage.getBoundingClientRect();
        this.player.targetX = Math.max(100, Math.min(this.worldWidth - 100, e.clientX - rect.left));
      });

      if (this.dom.muteBtn) {
        this.dom.muteBtn.addEventListener("click", () => {
          const m = sound.toggleMute();
          this.dom.muteBtn.innerHTML = m ? "🔇 Silencio" : "🔊 Sonido";
        });
      }

      document.getElementById("skip-intro-btn")?.addEventListener("click", () => this.finishIntro());
      document.getElementById("victory-restart-btn")?.addEventListener("click", () => location.reload());
      document.getElementById("victory-explore-btn")?.addEventListener("click", () => {
        this.dom.victory?.classList.remove("active");
      });

      // Botón de la cueva
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("#btn-enter-cave") || e.target.closest(".enter-cave-btn");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        sound.resume();
        if (!this.state.caveActive && !this.state.z3) {
          this.startCaveExploration();
        }
      });
    }

    startIntro() {
      if (typeof gsap === "undefined") {
        setTimeout(() => this.finishIntro(), 5000);
        return;
      }
      const tl = gsap.timeline({ onComplete: () => this.finishIntro() });
      tl.to(".library-stage", { scale: 1.4, duration: 2.8, ease: "power2.inOut" });
      tl.call(() => sound.bookOpen(), null, 1.5);
      tl.to(".book-cover", { rotateY: -165, duration: 2.0, ease: "power2.out" }, 1.5);
      tl.to(".book-pages", { opacity: 1, duration: 1.0 }, 2.2);
      tl.to("#cinematic-intro", { opacity: 0, scale: 2.2, filter: "blur(16px)", duration: 1.5 }, 5.6);
    }

    finishIntro() {
      if (this.state.introDone) return;
      this.state.introDone = true;
      sound.resume();
      if (this.dom.intro) this.dom.intro.style.display = "none";
      this.dom.world.classList.add("active");
      this.showToast("✦ Valle de Vigirima", "Parque Arqueológico Piedra Pintada • Municipio Guacara, Carabobo. Camina hacia el este.", 7000);
    }

    showToast(title, text, duration = 6000) {
      if (this.dom.toastTitle) this.dom.toastTitle.textContent = title;
      if (this.dom.toastText) this.dom.toastText.textContent = text;
      this.dom.toast.classList.add("show");
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => this.dom.toast.classList.remove("show"), duration);
    }

    triggerSpirit() {
      sound.spiritRoar();
      document.body.classList.add("spirit-attack");
      const overlay = document.getElementById("spirit-attack-overlay");
      if (overlay) overlay.classList.add("active");
      setTimeout(() => {
        if (overlay) overlay.classList.remove("active");
        document.body.classList.remove("spirit-attack");
      }, 1100);
    }

    gameLoop() {
      const loop = () => {
        if (!this.state.caveActive) {
          this.updatePlayer();
          this.updateCamera();
          this.checkEnterCave();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    updatePlayer() {
      if (!this.state.introDone) return;
      let moving = false;
      if (this.keys.left) { this.player.vx = -this.player.speed; this.player.dir = -1; moving = true; }
      else if (this.keys.right) { this.player.vx = this.player.speed; this.player.dir = 1; moving = true; }
      else if (this.player.targetX !== null) {
        const dx = this.player.targetX - this.player.x;
        if (Math.abs(dx) > 6) {
          this.player.dir = dx > 0 ? 1 : -1;
          this.player.vx = this.player.dir * this.player.speed;
          moving = true;
        } else {
          this.player.x = this.player.targetX;
          this.player.vx = 0;
          this.player.targetX = null;
        }
      } else {
        this.player.vx *= 0.75;
        if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
      }
      this.player.x = Math.max(80, Math.min(this.worldWidth - 80, this.player.x + this.player.vx));
      if (moving && Math.abs(this.player.vx) > 0.5) {
        this.dom.player.classList.add("walking");
        sound.footstep();
      } else {
        this.dom.player.classList.remove("walking");
      }
      this.dom.player.style.left = this.player.x + "px";
      this.dom.player.style.transform = `translateX(-50%) scaleX(${this.player.dir})`;
    }

    updateCamera() {
      const w = innerWidth;
      const target = Math.max(0, Math.min(this.worldWidth - w, this.player.x - w / 2));
      this.cam.x += (target - this.cam.x) * 0.08;
      this.dom.stage.style.transform = `translateX(${-this.cam.x}px)`;
      document.getElementById("layer-mountains-back")?.style.setProperty("transform", `translateX(${-this.cam.x * 0.18}px)`);
      document.getElementById("layer-mountains-mid")?.style.setProperty("transform", `translateX(${-this.cam.x * 0.4}px)`);
    }

    initStars() {
      const c = document.getElementById("stars-canvas");
      if (!c) return;
      const ctx = c.getContext("2d");
      c.width = innerWidth; c.height = innerHeight;
      const stars = Array.from({length:80}, () => ({
        x: Math.random()*c.width, y: Math.random()*c.height*0.6,
        r: Math.random()*1.4+0.4, a: Math.random()*0.75+0.25
      }));
      const draw = () => {
        ctx.clearRect(0,0,c.width,c.height);
        stars.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.fillStyle = `rgba(255,245,220,${s.a})`;
          ctx.fill();
        });
        requestAnimationFrame(draw);
      };
      draw();
    }

    // ZONA 1
    initZone1() {
      const piecesData = [
        {id:0,tx:0,ty:0},{id:1,tx:140,ty:0},
        {id:2,tx:0,ty:93},{id:3,tx:140,ty:93},
        {id:4,tx:0,ty:186},{id:5,tx:140,ty:186}
      ];
      const cont = document.getElementById("zone1-scattered-pieces");
      const frame = document.getElementById("monolith-frame");
      if (!cont || !frame) return;

      piecesData.forEach(p => {
        const slot = document.createElement("div");
        slot.className = "monolith-slot";
        slot.style.cssText = `position:absolute;left:${p.tx}px;top:${p.ty}px;width:140px;height:93px;`;
        frame.appendChild(slot);
      });

      piecesData.forEach(p => {
        const el = document.createElement("div");
        el.className = "stone-piece";
        el.style.width = "115px"; el.style.height = "78px";
        const ox = -(p.id%2)*140, oy = -Math.floor(p.id/2)*93;
        el.innerHTML = `<div style="position:absolute;width:280px;height:280px;transform:translate(${ox}px,${oy}px);pointer-events:none;">${this.getDiosaSVG()}</div>`;
        cont.appendChild(el);

        if (typeof Draggable !== "undefined") {
          Draggable.create(el, {
            type: "x,y",
            onPress: () => { sound.resume(); sound.drag(); el.classList.add("dragging"); },
            onRelease: function () {
              el.classList.remove("dragging");
              const fr = frame.getBoundingClientRect();
              const pr = el.getBoundingClientRect();
              if (Math.hypot(pr.left-(fr.left+p.tx), pr.top-(fr.top+p.ty)) < 75) {
                sound.snap();
                el.classList.add("snapped");
                this.disable();
                frame.appendChild(el);
                gsap.set(el, {position:"absolute", left:p.tx, top:p.ty, x:0, y:0, width:140, height:93});
                window.game.checkZone1();
              } else {
                window.game.triggerSpirit();
                gsap.to(el, {x:0, y:0, duration:0.4});
              }
            }
          });
        }
      });
      window.game = this;
    }

    getDiosaSVG() {
      return `<svg viewBox="0 0 280 280" style="width:100%;height:100%"><rect width="280" height="280" fill="#131922" rx="6"/><g stroke="#e5b253" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M140 25 L140 10 M115 30 L105 15 M165 30 L175 15 M90 40 L75 25 M190 40 L205 25"/><path d="M70 55 Q140 25 210 55" stroke-width="5.5"/><ellipse cx="140" cy="85" rx="50" ry="35" stroke-width="5.5"/><circle cx="120" cy="82" r="8"/><circle cx="160" cy="82" r="8"/><circle cx="120" cy="82" r="3" fill="#e5b253"/><circle cx="160" cy="82" r="3" fill="#e5b253"/><path d="M140 85 L140 96 L134 96"/><path d="M126 104 Q140 110 154 104"/><path d="M90 95 Q65 110 70 140 Q75 160 95 150"/><path d="M190 95 Q215 110 210 140 Q205 160 185 150"/><path d="M110 120 L110 190 Q140 200 170 190 L170 120" stroke-width="5"/><path d="M125 135 L125 255" stroke="#ffd700" stroke-width="5"/><path d="M140 130 L140 265" stroke="#ffd700" stroke-width="5.5"/><path d="M155 135 L155 255" stroke="#ffd700" stroke-width="5"/></g></svg>`;
    }

    checkZone1() {
      this.state.z1Count++;
      if (this.state.z1Count >= 6 && !this.state.z1) {
        this.state.z1 = true;
        sound.success();
        gsap.to("#monolith-frame", {boxShadow:"0 0 55px rgba(255,215,0,0.95)", duration:1.4});
        this.dom.path12?.classList.add("active");
        this.showToast("✓ Diosa de la Lluvia restaurada", "Ahora ordena el ciclo sagrado del agua en la Zona 2.", 7500);
      }
    }

    // ZONA 2
    initZone2() {
      const zone2 = document.getElementById("zone-2-anchor");
      if (!zone2) return;

      const cycle = [
        {id:1, name:"Sequía", icon:"☀️"},
        {id:2, name:"Nubes", icon:"🌀"},
        {id:3, name:"Lluvia", icon:"🌊"},
        {id:4, name:"Fertilidad", icon:"🌿"},
        {id:5, name:"Cosecha", icon:"🌽"}
      ];
      const shuffled = [...cycle].sort(() => Math.random() - 0.5);

      let track = document.getElementById("order-track");
      if (!track) {
        track = document.createElement("div");
        track.id = "order-track";
        track.style.cssText = "display:flex;gap:14px;justify-content:center;margin:24px 0;flex-wrap:wrap;";
        for (let i = 1; i <= 5; i++) {
          const slot = document.createElement("div");
          slot.className = "order-slot";
          slot.dataset.pos = i;
          slot.style.cssText = "width:100px;height:110px;border:2px dashed rgba(229,178,83,0.5);border-radius:12px;background:rgba(15,10,5,0.7);display:flex;align-items:center;justify-content:center;";
          track.appendChild(slot);
        }
        zone2.appendChild(track);
      }

      let pool = document.getElementById("order-cards-pool");
      if (!pool) {
        pool = document.createElement("div");
        pool.id = "order-cards-pool";
        pool.style.cssText = "display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:18px;";
        zone2.appendChild(pool);
      }
      pool.innerHTML = "";

      shuffled.forEach(c => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.dataset.id = c.id;
        card.innerHTML = `<div style="font-size:32px">${c.icon}</div><div style="font-size:12px;margin-top:6px;font-family:Cinzel,serif">${c.name}</div>`;
        card.style.cssText = "width:100px;height:110px;background:linear-gradient(145deg,#3a2e20,#221810);border:2px solid #c9a227;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:grab;color:#e5b253;";
        pool.appendChild(card);

        if (typeof Draggable !== "undefined") {
          Draggable.create(card, {
            type: "x,y",
            onPress: () => { sound.resume(); sound.drag(); },
            onRelease: function () {
              let placed = false;
              track.querySelectorAll(".order-slot").forEach(slot => {
                if (slot.children.length > 0) return;
                const sr = slot.getBoundingClientRect();
                const cr = card.getBoundingClientRect();
                if (Math.hypot(cr.left - sr.left, cr.top - sr.top) < 70) {
                  const expected = parseInt(slot.dataset.pos);
                  if (parseInt(card.dataset.id) === expected) {
                    sound.snap();
                    slot.appendChild(card);
                    slot.classList.add("filled");
                    gsap.set(card, {x:0, y:0});
                    this.disable();
                    window.game.state.z2Placed++;
                    window.game.checkZone2();
                    placed = true;
                  } else {
                    window.game.triggerSpirit();
                    gsap.to(card, {x:0, y:0, duration:0.4});
                  }
                }
              });
              if (!placed) gsap.to(card, {x:0, y:0, duration:0.35});
            }
          });
        }
      });
    }

    checkZone2() {
      if (this.state.z2Placed >= 5 && !this.state.z2) {
        this.state.z2 = true;
        sound.success();
        sound.water();
        this.dom.path23?.classList.add("active");
        this.showToast("✓ Ciclo del Agua completado", "Sigue caminando hacia el este para la Búsqueda Nocturna.", 7500);
      }
    }

    // Auto-activar al caminar después de Zona 2
    checkEnterCave() {
      if (this.state.z2 && !this.state.caveActive && !this.state.z3 && this.player.x > 2600) {
        this.startCaveExploration();
      }
    }

    // ===================== ZONA 3 - BÚSQUEDA NOCTURNA =====================

    // =========================================================================
  // BÚSQUEDA ARQUEOLÓGICA NOCTURNA (ZONA 3) - SOPORTE MÓVIL Y PC UNIFICADO
  // =========================================================================
  function startNightSearch() {
    const existingGame = document.getElementById("vigirima-night-game");
    if (existingGame) return;

    // Contenedor principal de la cueva
    const game = document.createElement("div");
    game.id = "vigirima-night-game";
    game.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: #020101; overflow: hidden; touch-action: none;
    `;
    document.body.appendChild(game);

    // Canvas de oscuridad
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = "position:absolute; inset:0; width:100%; height:100%; pointer-events:none;";
    game.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    // Indicador visual de la linterna
    const light = document.createElement("div");
    light.style.cssText = `
      position: absolute; width: 60px; height: 60px; border-radius: 50%;
      background: rgba(255,240,180,0.25); pointer-events: none;
      transform: translate(-50%,-50%); z-index: 20;
      box-shadow: 0 0 25px 15px rgba(255,230,150,0.5);
    `;
    game.appendChild(light);

    // Contador superior
    const counter = document.createElement("div");
    counter.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.85); border: 1px solid #c9a227; color: #ffd700;
      font-family: Cinzel, serif; font-size: 14px; padding: 8px 20px;
      border-radius: 20px; z-index: 100000; pointer-events: none;
    `;
    counter.textContent = "Seleccionados: 0 / 3";
    game.appendChild(counter);

    let selected = [];
    let finished = false;

    // Objetos arqueológicos (4 correctos, 8 distractores)
    const objects = [
      { name: "Fragmento de Menhir", correct: true,  icon: "🗿", left: "15%", top: "30%" },
      { name: "Concha Ritual",       correct: true,  icon: "🐚", left: "35%", top: "20%" },
      { name: "Petroglifo",          correct: true,  icon: "✧",  left: "60%", top: "25%" },
      { name: "Hacha de Piedra",     correct: true,  icon: "🪓", left: "80%", top: "35%" },
      { name: "Moneda Colonial",     correct: false, icon: "🪙", left: "20%", top: "65%" },
      { name: "Lata Moderna",        correct: false, icon: "🥫", left: "45%", top: "60%" },
      { name: "Botella Plástica",    correct: false, icon: "🧴", left: "70%", top: "70%" },
      { name: "Clavo de Hierro",     correct: false, icon: "📌", left: "10%", top: "50%" }
    ];

    objects.forEach((obj) => {
      const item = document.createElement("div");
      item.style.cssText = `
        position: absolute; left: ${obj.left}; top: ${obj.top};
        transform: translate(-50%, -50%); width: 85px; text-align: center;
        cursor: pointer; opacity: 0.03; transition: opacity 0.2s, transform 0.15s; z-index: 10;
        touch-action: manipulation;
      `;
      item.innerHTML = `
        <div style="
          width: 55px; height: 55px; margin: 0 auto 4px;
          background: rgba(25,18,10,0.95); border: 2px solid #e5b253;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-size: 26px; box-shadow: 0 0 10px rgba(0,0,0,0.8);
        ">${obj.icon}</div>
        <div style="
          font-family: Cinzel, serif; font-size: 9.5px; color: #e5b253;
          background: rgba(0,0,0,0.9); padding: 3px 6px; border-radius: 4px;
          white-space: nowrap;
        ">${obj.name}</div>
      `;

      // Evento unificado para PC y Celular (PointerDown / Click)
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (finished || parseFloat(item.style.opacity) < 0.4) return;

        const exists = selected.find(s => s.name === obj.name);
        if (exists) {
          selected = selected.filter(s => s.name !== obj.name);
          item.style.outline = "none";
          item.style.transform = "translate(-50%, -50%) scale(1)";
        } else {
          if (selected.length >= 3) return;
          selected.push(obj);
          item.style.outline = "3px solid #ffd700";
          item.style.outlineOffset = "3px";
          item.style.transform = "translate(-50%, -50%) scale(1.1)";
        }
        counter.textContent = `Seleccionados: ${selected.length} / 3`;

        if (selected.length === 3) {
          setTimeout(showResult, 400);
        }
      };

      item.addEventListener("pointerdown", handleSelect);
      game.appendChild(item);
    });

    // Función de renderizado de oscuridad con linterna
    function drawLight(x, y) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(2, 1, 1, 0.98)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const radius = 130;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.4, "rgba(0,0,0,0.8)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    // Movimiento unificado (Ratón y Dáctil en Celular)
    const handleMove = (clientX, clientY) => {
      light.style.left = clientX + "px";
      light.style.top = clientY + "px";
      drawLight(clientX, clientY);

      // Revelar elementos bajo el haz de luz
      game.querySelectorAll("div[style*='position: absolute']").forEach(item => {
        if (!item.dataset || item === light || item === counter) return;
        const rect = item.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - clientX, cy - clientY);
        item.style.opacity = dist < 120 ? "1" : "0.03";
      });
    };

    game.addEventListener("pointermove", (e) => {
      handleMove(e.clientX, e.clientY);
    });

    // Iniciar luz en el centro por defecto
    drawLight(window.innerWidth / 2, window.innerHeight / 2);

    function showResult() {
      finished = true;
      counter.style.display = "none";
      const correctCount = selected.filter(s => s.correct).length;
      const won = (correctCount === 3);

      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(8,5,3,0.98); border: 2px solid ${won ? "#ffd700" : "#ff3333"};
        border-radius: 16px; padding: 30px 40px; color: #fff;
        font-family: Cinzel, serif; text-align: center; z-index: 100002;
        max-width: 380px; box-shadow: 0 0 40px rgba(0,0,0,0.9);
      `;
      modal.innerHTML = `
        <div style="font-size: 24px; color: ${won ? "#ffd700" : "#ff5555"}; margin-bottom: 10px;">
          ${won ? "¡Búsqueda Exitosa!" : "¡Has Fallado!"}
        </div>
        <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 20px;">
          ${won ? "Has hallado las reliquias auténticas de Vigirima." : "Seleccionaste elementos incorrectos o modernos."}
        </div>
        <button id="close-cave-res" style="padding: 10px 24px; background: transparent; border: 1px solid ${won ? "#ffd700" : "#ff5555"}; color: ${won ? "#ffd700" : "#ff5555"}; border-radius: 6px; font-family: Cinzel, serif; cursor: pointer;">
          ${won ? "Continuar con la Victoria" : "Intentar Nuevamente"}
        </button>
      `;
      document.body.appendChild(modal);

      document.getElementById("close-cave-res").onclick = () => {
        modal.remove();
        game.remove();
        counter.remove();
        if (won) {
          document.getElementById("victory-modal")?.classList.add("active");
        }
      };
    }
  }

  // Vincular apertura de cueva tanto por botón como por posición del jugador
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-enter-cave") || e.target.closest(".enter-cave-btn")) {
      e.preventDefault();
      startNightSearch();
    }
  });

  }

  document.addEventListener("DOMContentLoaded", () => {
    const world = new VigirimaWorld();
    world.init();
  });
})();
