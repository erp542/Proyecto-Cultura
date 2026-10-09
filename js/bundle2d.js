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
      // --- CONTROLES TÁCTILES D-PAD PARA CELULARES ---
      const btnLeft = document.getElementById("dpad-left");
      const btnRight = document.getElementById("dpad-right");

      if (btnLeft) {
        btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); this.keys.left = true; this.player.targetX = null; });
        btnLeft.addEventListener("touchend", () => { this.keys.left = false; });
        btnLeft.addEventListener("mousedown", () => { this.keys.left = true; this.player.targetX = null; });
        btnLeft.addEventListener("mouseup", () => { this.keys.left = false; });
      }
      if (btnRight) {
        btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); this.keys.right = true; this.player.targetX = null; });
        btnRight.addEventListener("touchend", () => { this.keys.right = false; });
        btnRight.addEventListener("mousedown", () => { this.keys.right = true; this.player.targetX = null; });
        btnRight.addEventListener("mouseup", () => { this.keys.right = false; });
      }
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

// ZONA 1 (Optimizada para que no se corte en móviles y responda al tacto)
    initZone1() {
      const piecesData = [
        {id:0,tx:0,ty:0},{id:1,tx:140,ty:0},
        {id:2,tx:0,ty:93},{id:3,tx:140,ty:93},
        {id:4,tx:0,ty:186},{id:5,tx:140,ty:186}
      ];
      const cont = document.getElementById("zone1-scattered-pieces");
      const frame = document.getElementById("monolith-frame");
      if (!cont || !frame) return;

      // Ajustar contenedor para evitar cortes en pantallas pequeñas de celulares
      const altar = document.querySelector(".monolith-altar");
      if (altar) {
        altar.style.transform = "scale(0.82)";
        altar.style.transformOrigin = "top center";
        altar.style.marginBottom = "-30px";
      }

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
        el.style.touchAction = "none"; // Vital para celulares en GitHub Pages
        const ox = -(p.id%2)*140, oy = -Math.floor(p.id/2)*93;
        el.innerHTML = `<div style="position:absolute;width:280px;height:280px;transform:translate(${ox}px,${oy}px);pointer-events:none;">${this.getDiosaSVG()}</div>`;
        cont.appendChild(el);

        if (typeof Draggable !== "undefined") {
          Draggable.create(el, {
            type: "x,y",
            liveSnap: true,
            onPress: function() { 
              sound.resume(); 
              sound.drag(); 
              this.target.classList.add("dragging"); 
            },
            onRelease: function () {
              this.target.classList.remove("dragging");
              const fr = frame.getBoundingClientRect();
              const pr = this.target.getBoundingClientRect();
              // Margen de tolerancia amplio (90px) para garantizar que funcione al tacto en móviles
              if (Math.hypot(pr.left - (fr.left + p.tx), pr.top - (fr.top + p.ty)) < 90) {
                sound.snap();
                this.target.classList.add("snapped");
                this.disable();
                frame.appendChild(this.target);
                gsap.set(this.target, {position:"absolute", left:p.tx, top:p.ty, x:0, y:0, width:140, height:93});
                window.game.checkZone1();
              } else {
                window.game.triggerSpirit();
                gsap.to(this.target, {x:0, y:0, duration:0.4, ease: "power2.out"});
              }
            }
          });
        }
      });
      window.game = this;
    },

    // ZONA 2 (Arreglada para GitHub Pages y dispositivos táctiles)
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
        zone2.appendChild(track);
      }
      track.innerHTML = "";
      track.style.cssText = "display:flex;gap:8px;justify-content:center;margin:16px 0;flex-wrap:wrap;";
      
      for (let i = 1; i <= 5; i++) {
        const slot = document.createElement("div");
        slot.className = "order-slot";
        slot.dataset.pos = i;
        slot.style.cssText = "width:72px;height:85px;border:2px dashed rgba(229,178,83,0.6);border-radius:10px;background:rgba(15,10,5,0.85);display:flex;align-items:center;justify-content:center;position:relative;";
        slot.innerHTML = `<span class="slot-number" style="font-family:Cinzel,serif;font-size:12px;color:rgba(229,178,83,0.4);">${i}</span>`;
        track.appendChild(slot);
      }

      let pool = document.getElementById("order-cards-pool");
      if (!pool) {
        pool = document.createElement("div");
        pool.id = "order-cards-pool";
        zone2.appendChild(pool);
      }
      pool.innerHTML = "";
      pool.style.cssText = "display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;";

      shuffled.forEach(c => {
        const card = document.createElement("div");
        card.className = "order-card";
        card.dataset.id = c.id;
        card.style.cssText = "width:72px;height:85px;background:linear-gradient(145deg,#3a2e20,#221810);border:2px solid #c9a227;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:grab;color:#e5b253;touch-action:none;user-select:none;";
        card.innerHTML = `<div style="font-size:24px">${c.icon}</div><div style="font-size:9px;margin-top:4px;font-family:Cinzel,serif;text-align:center;">${c.name}</div>`;
        pool.appendChild(card);

        if (typeof Draggable !== "undefined") {
          Draggable.create(card, {
            type: "x,y",
            liveSnap: true,
            onPress: function() { 
              sound.resume(); 
              sound.drag(); 
              this.target.classList.add("dragging");
            },
            onRelease: function () {
              this.target.classList.remove("dragging");
              let placed = false;
              const cardEl = this.target;
              const cardId = parseInt(cardEl.dataset.id);

              track.querySelectorAll(".order-slot").forEach(slot => {
                if (slot.children.length > 1) return; // Ya tiene una tarjeta (ignorando el span numérico)
                const sr = slot.getBoundingClientRect();
                const cr = cardEl.getBoundingClientRect();
                
                // Tolerancia de distancia aumentada para garantizar funcionamiento táctil en celulares
                if (Math.hypot(cr.left - sr.left, cr.top - sr.top) < 85) {
                  const expected = parseInt(slot.dataset.pos);
                  if (cardId === expected) {
                    sound.snap();
                    slot.appendChild(cardEl);
                    slot.classList.add("filled");
                    gsap.set(cardEl, {x:0, y:0, position:"relative", left:0, top:0, width:"100%", height:"100%"});
                    this.disable(); // Desactivar el draggable una vez colocado correctamente
                    window.game.state.z2Placed++;
                    window.game.checkZone2();
                    placed = true;
                  } else {
                    window.game.triggerSpirit();
                    gsap.to(cardEl, {x:0, y:0, duration:0.4, ease: "power2.out"});
                  }
                }
              });
              if (!placed) {
                gsap.to(cardEl, {x:0, y:0, duration:0.35, ease: "power2.out"});
              }
            }
          });
        }
      });
    },
    // ===================== ZONA 3 - BÚSQUEDA NOCTURNA =====================

  }

  document.addEventListener("DOMContentLoaded", () => {
    const world = new VigirimaWorld();
    world.init();
  });
})();
