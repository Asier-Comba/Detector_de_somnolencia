'use strict';

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL_URL     = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
const EAR_THRESHOLD = 0.28;  // below this → eye is closing (0.28 catches half-closed eyes)
const ALERT_FRAMES  = 8;     // consecutive low-EAR frames to trigger alert (~0.8 s at ~10 fps)
const RESET_FRAMES  = 4;     // consecutive open frames required to cancel the alert

// ── State ─────────────────────────────────────────────────────────────────────
let drowsyFrames = 0;
let openFrames   = 0;
let drowsyCount  = 0;
let isAlerting   = false;
let alertStart   = null;
let audioCtx     = null;
let beepTimer    = null;
let running      = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const video        = document.getElementById('video');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const alertOverlay = document.getElementById('alert-overlay');
const statusCard   = document.getElementById('status-card');
const statusIcon   = document.getElementById('status-icon');
const statusText   = document.getElementById('status-text');
const earDisplay   = document.getElementById('ear-value');
const earBar       = document.getElementById('ear-bar');
const drowsyEl     = document.getElementById('drowsy-count');
const timerEl      = document.getElementById('alert-timer');
const loadingCard  = document.getElementById('loading-card');
const loadingText  = document.getElementById('loading-text');

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  setLoading('Cargando modelos de IA…');

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);
  } catch (err) {
    setLoading('❌ Error cargando modelos: ' + err.message);
    return;
  }

  setLoading('Accediendo a la cámara…');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    });
    video.srcObject = stream;
  } catch (err) {
    setLoading('❌ Sin acceso a la cámara: ' + err.message);
  }
}

video.addEventListener('play', () => {
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  loadingCard.classList.add('hidden');
  running = true;
  loop();
});

// ── Detection loop ────────────────────────────────────────────────────────────
const detectorOpts = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4, inputSize: 224 });

async function loop() {
  if (!running) return;

  const det = await faceapi
    .detectSingleFace(video, detectorOpts)
    .withFaceLandmarks(true); // true = use tiny landmark model

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (det) {
    const leftEye  = det.landmarks.getLeftEye();
    const rightEye = det.landmarks.getRightEye();
    const ear      = (computeEAR(leftEye) + computeEAR(rightEye)) / 2;

    drawEye(leftEye, ear);
    drawEye(rightEye, ear);
    updateEARBar(ear);
    processState(ear);
  } else {
    setStatus('', '🔍', 'Buscando cara…');
    earDisplay.textContent = '—';
    earBar.style.width = '0%';
  }

  requestAnimationFrame(loop);
}

// ── EAR calculation ───────────────────────────────────────────────────────────
// Per eye, face-api.js gives 6 points:
// 0=leftCorner, 1=topLeft, 2=topRight, 3=rightCorner, 4=bottomRight, 5=bottomLeft
function computeEAR(eye) {
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2 * C);
}

function dist(p, q) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// ── Draw eye outline ──────────────────────────────────────────────────────────
function drawEye(pts, ear) {
  const color = ear < EAR_THRESHOLD ? '#ff5252' : '#00e676';

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.fillStyle   = color + '28';
  ctx.fill();

  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

// ── State machine ─────────────────────────────────────────────────────────────
function processState(ear) {
  if (ear < EAR_THRESHOLD) {
    drowsyFrames++;
    openFrames = 0;

    if (drowsyFrames >= ALERT_FRAMES) {
      if (!isAlerting) {
        isAlerting = true;
        alertStart = Date.now();
        drowsyCount++;
        drowsyEl.textContent = drowsyCount;
        startBeeping();
        tickTimer();
      }
      alertOverlay.classList.remove('hidden');
      setStatus('alert', '😴', '¡SOMNOLENCIA!');
    } else {
      setStatus('warning', '😪', 'Ojos cerrándose…');
    }

  } else {
    openFrames++;

    // Only reset drowsy counter after several consecutive open frames (avoids blinking resets)
    if (openFrames >= RESET_FRAMES) {
      drowsyFrames = 0;

      if (isAlerting) {
        isAlerting = false;
        alertStart  = null;
        stopBeeping();
        alertOverlay.classList.add('hidden');
        timerEl.textContent = '—';
      }

      setStatus('attentive', '👁️', 'Atento');
    }
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function setStatus(cls, icon, text) {
  statusCard.className = 'status-card' + (cls ? ' ' + cls : '');
  statusIcon.textContent = icon;
  statusText.textContent = text;
}

function updateEARBar(ear) {
  earDisplay.textContent = ear.toFixed(3);
  const pct = Math.min(ear / 0.5, 1) * 100;
  earBar.style.width = pct + '%';
  earBar.style.background =
    ear < EAR_THRESHOLD ? '#ff5252' :
    ear < 0.32          ? '#ffd740' :
                          '#00e676';
}

function setLoading(msg) {
  loadingText.textContent = msg;
  loadingCard.classList.remove('hidden');
}

function tickTimer() {
  if (!isAlerting || !alertStart) return;
  timerEl.textContent = ((Date.now() - alertStart) / 1000).toFixed(1) + 's';
  requestAnimationFrame(tickTimer);
}

// ── Audio alert ───────────────────────────────────────────────────────────────
function startBeeping() {
  if (beepTimer) return;
  beep();
  beepTimer = setInterval(beep, 900);
}

function stopBeeping() {
  clearInterval(beepTimer);
  beepTimer = null;
}

function beep() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.38);
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
