# 👁️ Detector de Somnolencia

> App web que detecta somnolencia en tiempo real analizando la apertura de los ojos con IA. Sin backend, sin instalación — funciona 100% en el navegador.

![face-api.js](https://img.shields.io/badge/face--api.js-0.22.2-7c6fff?style=flat-square)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-latest-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![Sin backend](https://img.shields.io/badge/backend-ninguno-00e676?style=flat-square)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue?style=flat-square)

---

## ¿Qué hace?

Abre la cámara, detecta tu cara en tiempo real y calcula si tus ojos están cerrados. Si permanecen cerrados más de **1.5 segundos**, dispara una alerta visual y sonora. Ideal para demos de IA aplicada y proyectos de computer vision sin necesidad de Python ni GPU.

---

## Demo rápida

```bash
# Clona el repositorio
git clone https://github.com/Asier-Comba/Detector_de_somnolencia.git
cd Detector_de_somnolencia

# Lanza un servidor local (elige uno)
python -m http.server 8000
npx serve .
```

Abre **http://localhost:8000** en tu navegador y permite el acceso a la cámara.

> **Nota:** La cámara solo funciona desde `localhost` o HTTPS. No abras `index.html` directamente como archivo.

---

## Cómo funciona

```
Webcam → TinyFaceDetector → 68 landmarks → EAR → Umbral → Alerta
```

| Paso | Qué ocurre |
|---|---|
| **1. Detección facial** | `face-api.js` localiza la cara en cada frame usando TinyFaceDetector |
| **2. Landmarks** | Mapea 68 puntos clave del rostro, incluyendo los 6 puntos de cada ojo |
| **3. Cálculo EAR** | Calcula el Eye Aspect Ratio de cada ojo con distancias euclídeas |
| **4. Umbral** | Si EAR < 0.25 durante ≥ 15 frames consecutivos (~1.5 s) → alerta |
| **5. Alerta** | Overlay rojo parpadeante + pitido sonoro + contador de microsueños |

### Fórmula EAR (Eye Aspect Ratio)

```
        ||p2−p6|| + ||p3−p5||
EAR =  ───────────────────────
             2 · ||p1−p4||
```

Los puntos `p1–p6` son los 6 vértices del contorno del ojo:

```
        p2  p3
   p1 ·      · p4
        p6  p5
```

- **Ojo abierto** → EAR ≈ 0.30 – 0.40
- **Ojo cerrándose** → EAR ≈ 0.25 – 0.30
- **Ojo cerrado** → EAR < 0.25

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| [face-api.js](https://github.com/justadudewhohacks/face-api.js) | 0.22.2 | Detección facial y landmarks (sobre TensorFlow.js) |
| TensorFlow.js | (incluido) | Motor de inferencia en el navegador |
| Web Audio API | nativa | Alarma sonora generada programáticamente |
| HTML / CSS / JS | — | Sin frameworks ni dependencias adicionales |

Todo cargado desde CDN — **sin `npm install`, sin build step**.

---

## Estructura del proyecto

```
Detector_de_somnolencia/
├── index.html   # Interfaz y estructura
├── style.css    # Diseño dark mode
├── app.js       # Lógica de detección, EAR y alertas
└── README.md
```

---

## Aplicaciones reales

- Sistemas antifatiga para **conductores**
- Monitorización de **operarios de maquinaria pesada**
- Control de atención en **entornos educativos**
- Base para wearables o apps móviles de bienestar

---

## Autor

**Asier Comba** — Estudiante de Ingeniería Informática, Universidad de Deusto
[github.com/Asier-Comba](https://github.com/Asier-Comba)
