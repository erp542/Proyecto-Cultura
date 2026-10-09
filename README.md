# 🌄 El Despertar de Vigirima (Nivel 1)
### Prototipo Interactivo 2.5D • Exploración Arqueológica Continua y Batalla Ancestral
**Yacimiento:** Parque Arqueológico Piedra Pintada • Valle de Vigirima, Municipio Guacara, Estado Carabobo, Venezuela.

---

## 🌟 Visión del Proyecto y Filosofía de Diseño

Este prototipo sumerge al jugador en un **mundo 2.5D explorable y continuo** de 4800 píxeles de longitud (estilo de inmersión y dinamismo de *Fireboy and Watergirl* o mundos de exploración en *Roblox*).

* **Cero Cuestionarios:** Todo el aprendizaje ocurre mediante la **acción, la observación, el arrastre espacial y reflejos en combate**.
* **Mundo Continuo con Parallax:** Paisaje de Vigirima que abarca desde la llanura inicial del monolito, pasando por el altar sagrado del agua, el paso calcinado de advertencia, hasta la colina megalítica del combate final.
* **Control del Explorador:** Teclas (`A`/`D` o flechas `◄`/`►`), **clic/toque directo en el suelo** o **botones táctiles para celulares**.
* **Audio Robusto e Impactante:** Síntesis sonora procedural Web Audio API (fricción de piedra, acoples magnéticos, agua sagrada, pasos y el aterrador rugido gutural FM del Espíritu de la Sequía con impacto sísmico).

---

## 🏛️ Contexto Arqueológico Real Integrado (Municipio Guacara)

1. **La Diosa de las Lluvias (Zona 1):** Petroglifo antropomorfo grabado en bajo relieve sobre roca esquistosa. Exhibe una diadema de rayos solares y surcos verticales que encarnan la lluvia descendiendo para fertilizar los suelos de cultivo de yuca amarga y maíz en las estribaciones de la Cordillera de la Costa.
2. **El Altar del Ciclo Agrícola del Agua (Zona 2):** Carril ceremonial donde se ordenan las 5 fases vitales: *Sequía ➔ Viento (nubes) ➔ Lluvia ➔ Brote ➔ Cosecha*.
3. **Los Menhires de Piedra Pintada y el Espíritu de la Sequía (Zona 3):** Columnas de piedra hincadas en hilera ceremonial que actuaban como observatorio astronómico solsticial y equinoccial de los pueblos prehispánicos de la cuenca del Lago de Valencia (Fase Valencioide, 800 - 1500 d.C. • Arawak y Caribe).

---

## 🎮 Estructura y Mecánicas del Nivel 1

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTRO CINEMÁTICA AUTOMÁTICA                     │
│  Biblioteca clásica 3D ➔ Zoom hacia el atril ➔ Apertura del Libro 3D   │
│    ➔ Revelación de "Nivel 1: El Despertar de Vigirima" ➔ Inmersión     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  MUNDO CONTINUO DEL VALLE (4800 PX)                    │
│                                                                        │
│  [ZONA 1: Monolito] ──(Sendero Dorado 1)──► [ZONA 2: Altar del Agua]   │
│  • 6 bloques de la Diosa                    • Carril con 5 ranuras     │
│  • Ensamble magnético                       • Secuencia natural        │
│  • Fusión de roca y luz                     • Llenado de acueducto     │
│                                                      │                 │
│                                             (Sendero Dorado 2)         │
│                                                      │                 │
│                                                      ▼                 │
│                                           [PASO CALCINADO: 3000px]     │
│                                           • Monolito de Advertencia    │
│                                           • Oscurecimiento del cielo   │
│                                                      │                 │
│                                                      ▼                 │
│                                      [ZONA 3: BOSS FIGHT CONTRA EL     │
│                                       ESPÍRITU DE LA SEQUÍA]           │
│                                       • Jefe flotante con 4 HP         │
│                                       • 3 Amuletos de vida del jugador │
│                                       • Cargas de calor y cuenta atrás │
│                                       • Activación del Menhir correcto │
│                                       • Castigo: ¡Pantalla roja +      │
│                                         rugido monstruoso + daño!      │
│                                       • Victoria: Rayo celestial,      │
│                                         lluvia y amanecer dorado       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Ejecución en Windows y Celulares

1. **Con un solo clic (Recomendada):** Haz doble clic en el archivo **`iniciar_juego.bat`**. Abrirá tu navegador y te dará la IP local para jugar en tu celular conectado a la misma red Wi-Fi.
2. **Doble clic directo:** Abre **`index.html`** directamente en tu navegador (Edge, Chrome, Firefox).
