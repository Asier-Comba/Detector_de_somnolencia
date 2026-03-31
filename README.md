# 👁️ Detector de Somnolencia

App web que detecta somnolencia en tiempo real analizando la apertura de los ojos con IA. Sin backend, sin instalación — funciona directamente en el navegador.

## Ejecutar

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Abre `http://localhost:8000` y permite el acceso a la cámara.

> Requiere HTTPS o localhost para acceder a la cámara del navegador.

## Cómo funciona

1. **Detección facial** — `face-api.js` localiza la cara en cada frame con TinyFaceDetector
2. **Landmarks** — mapea 68 puntos del rostro, incluyendo los contornos de ambos ojos
3. **EAR (Eye Aspect Ratio)** — calcula la apertura del ojo con geometría vectorial
4. **Alerta** — si EAR < 0.25 durante más de 1.5 segundos → alerta visual + sonido

### Fórmula EAR

```
EAR = ( ||p2−p6|| + ||p3−p5|| ) / ( 2 × ||p1−p4|| )
```

Donde `p1–p6` son los 6 puntos del contorno de cada ojo.
Ojo abierto → EAR ≈ 0.30–0.40 · Ojo cerrado → EAR < 0.25

## Stack

| Tecnología | Uso |
|---|---|
| face-api.js | Detección facial y landmarks (sobre TensorFlow.js) |
| Web Audio API | Alarma sonora generada programáticamente |
| HTML / CSS / JS | Sin frameworks ni backend |

## Aplicaciones reales

- Detección de somnolencia en conductores
- Monitorización de operarios de maquinaria pesada
- Control de atención en entornos educativos

## Autor

[Asier Comba](https://github.com/Asier-Comba) — Estudiante de Ingeniería Informática, Universidad de Deusto
