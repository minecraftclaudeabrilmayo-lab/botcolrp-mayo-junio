// ============================================================
// GENERADOR DE CÉDULA - Colombia Roleplay Bot
// Canvas: genera la imagen de la cédula automáticamente
// ============================================================
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');

// ── Dimensiones de la cédula (proporción real cédula colombiana) ──
const W = 1010; // ancho total
const H = 638;  // alto total

// ── Posición y tamaño del recuadro de foto ────────────────────────
const PHOTO = { x: 42, y: 130, w: 220, h: 265 };

// ── Colores Colombia ──────────────────────────────────────────────
const COL_RED    = '#C8102E';
const COL_BLUE   = '#003087';
const COL_YELLOW = '#FCD116';
const COL_GRAY   = '#E8E8E8';
const COL_BG     = '#F5F5F0';
const COL_TEXT   = '#1A1A2E';
const COL_LABEL  = '#8B7355';
const COL_BORDER = '#B8A090';

/**
 * Genera la imagen de la cédula y devuelve un Buffer PNG.
 */
async function generarCedula({ nombres, apellidos, fechaNacimiento, genero,
  lugarNacimiento, numeroCedula, avatarBuffer }) {

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── 1. Fondo principal ─────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0,   '#F0EDE6');
  bgGrad.addColorStop(0.5, COL_BG);
  bgGrad.addColorStop(1,   '#EAE5DC');
  ctx.fillStyle = bgGrad;
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // ── 2. Borde exterior ─────────────────────────────────────────
  ctx.strokeStyle = COL_BORDER;
  ctx.lineWidth   = 3;
  ctx.roundRect(2, 2, W - 4, H - 4, 14);
  ctx.stroke();

  // ── 3. Franja superior roja ────────────────────────────────────
  ctx.fillStyle = COL_RED;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, 110, [14, 14, 0, 0]);
  ctx.fill();

  // ── 4. Franja amarilla decorativa ─────────────────────────────
  ctx.fillStyle = COL_YELLOW;
  ctx.fillRect(0, 108, W, 6);

  // ── 5. Franja azul bajo el amarillo ───────────────────────────
  ctx.fillStyle = COL_BLUE;
  ctx.fillRect(0, 114, W, 4);

  // ── 6. Texto del encabezado ────────────────────────────────────
  // "CÉDULA DE CIUDADANÍA" (izq)
  ctx.fillStyle = '#FFFFFF';
  ctx.font      = 'bold 13px Arial';
  ctx.fillText('CÉDULA DE', 18, 38);
  ctx.fillText('CIUDADANÍA', 18, 56);

  // Bandera Colombia (rectángulos simples)
  drawFlag(ctx, 130, 20, 60, 40);

  // "REPÚBLICA DE COLOMBIA" (centro-derecha)
  ctx.fillStyle = '#FFFFFF';
  ctx.font      = 'bold 30px Arial';
  ctx.fillText('REPÚBLICA DE COLOMBIA', 210, 65);

  // ── 7. Recuadro de foto ────────────────────────────────────────
  ctx.fillStyle = '#D0C8BE';
  ctx.fillRect(PHOTO.x - 3, PHOTO.y - 3, PHOTO.w + 6, PHOTO.h + 6);
  ctx.fillStyle = '#C2B8AC';
  ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);

  // ── 8. Foto del avatar ─────────────────────────────────────────
  if (avatarBuffer) {
    try {
      const img = await loadImage(avatarBuffer);
      // Calcular recorte para ajustar al recuadro sin salirse
      const scale    = Math.max(PHOTO.w / img.width, PHOTO.h / img.height);
      const sw       = PHOTO.w / scale;
      const sh       = PHOTO.h / scale;
      const sx       = (img.width  - sw) / 2;
      const sy       = (img.height - sh) / 2;

      ctx.save();
      ctx.rect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
      ctx.restore();
    } catch { /* fallo silencioso, queda el rectángulo gris */ }
  }

  // Borde sobre la foto
  ctx.strokeStyle = '#A09080';
  ctx.lineWidth   = 2;
  ctx.strokeRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);

  // ── 9. Datos del ciudadano ─────────────────────────────────────
  const dataX = 295; // columna de datos
  let   dataY = 148;

  // Función local para campo
  function campo(label, valor, yPos, labelColor = COL_LABEL) {
    ctx.fillStyle = labelColor;
    ctx.font      = '13px Arial';
    ctx.fillText(label, dataX, yPos);
    ctx.fillStyle = COL_TEXT;
    ctx.font      = 'bold 22px Arial';
    ctx.fillText(valor, dataX, yPos + 24);
  }

  campo('Apellidos',         apellidos,        dataY);
  campo('Nombres',           nombres,          dataY + 68);
  campo('Fecha de nacimiento', fechaNacimiento, dataY + 136);

  // Sexo y Número Cédula en la misma fila
  ctx.fillStyle = COL_LABEL;
  ctx.font      = '13px Arial';
  ctx.fillText('Sexo', dataX + 200, dataY + 136);
  ctx.fillText('Número Cédula', dataX + 280, dataY + 136);

  ctx.fillStyle = COL_TEXT;
  ctx.font      = 'bold 22px Arial';
  ctx.fillText(genero,       dataX + 200, dataY + 160);

  ctx.fillStyle = '#C8102E';
  ctx.font      = 'bold 22px Arial';
  ctx.fillText(numeroCedula, dataX + 280, dataY + 160);
  ctx.fillStyle = COL_TEXT;

  campo('Lugar de nacimiento', lugarNacimiento, dataY + 200);

  // Fecha de expiración (5 años desde hoy)
  const expYear = new Date().getFullYear() + 5;
  const expStr  = `${String(new Date().getDate()).padStart(2,'0')}/${String(new Date().getMonth()+1).padStart(2,'0')}/${expYear}`;
  campo('Fecha de expiración', expStr, dataY + 268);

  // ── 10. Separadores horizontales ──────────────────────────────
  ctx.strokeStyle = '#D0C0B0';
  ctx.lineWidth   = 1;
  const sepXs = [dataY + 56, dataY + 124, dataY + 192, dataY + 258];
  for (const sy of sepXs) {
    ctx.beginPath();
    ctx.moveTo(dataX, sy + 4);
    ctx.lineTo(W - 40, sy + 4);
    ctx.stroke();
  }

  // ── 11. Mariposas decorativas (esquina der) ────────────────────
  drawButterflies(ctx, W - 140, 130);

  // ── 12. Franja inferior ────────────────────────────────────────
  ctx.fillStyle = COL_BLUE;
  ctx.beginPath();
  ctx.roundRect(0, H - 50, W, 50, [0, 0, 14, 14]);
  ctx.fill();

  ctx.fillStyle = COL_YELLOW;
  ctx.fillRect(0, H - 52, W, 4);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font      = '12px Arial';
  ctx.fillText('REPÚBLICA DE COLOMBIA · REGISTRADURÍA NACIONAL DEL ESTADO CIVIL', 20, H - 20);

  // ── 13. Marca de agua diagonal ────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle   = COL_BLUE;
  ctx.font        = 'bold 90px Arial';
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText('COLOMBIA', -200, 0);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

// ── Helpers de dibujo ─────────────────────────────────────────────

function drawFlag(ctx, x, y, w, h) {
  const third = h / 3;
  // Amarillo (mitad superior)
  ctx.fillStyle = '#FCD116';
  ctx.fillRect(x, y, w, h / 2);
  // Azul (un cuarto)
  ctx.fillStyle = '#003087';
  ctx.fillRect(x, y + h / 2, w, h / 4);
  // Rojo (un cuarto)
  ctx.fillStyle = '#C8102E';
  ctx.fillRect(x, y + (3 * h) / 4, w, h / 4);
  // Borde
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function drawButterflies(ctx, startX, startY) {
  const positions = [
    { x: startX + 60, y: startY + 20,  s: 1.0, a: 0.6 },
    { x: startX + 20, y: startY + 70,  s: 0.7, a: 0.5 },
    { x: startX + 80, y: startY + 100, s: 0.8, a: 0.55 },
    { x: startX + 10, y: startY + 150, s: 0.6, a: 0.4 },
    { x: startX + 70, y: startY + 180, s: 0.5, a: 0.45 },
    { x: startX + 30, y: startY + 230, s: 0.9, a: 0.65 },
  ];

  for (const p of positions) {
    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.translate(p.x, p.y);
    ctx.scale(p.s, p.s);
    drawSingleButterfly(ctx);
    ctx.restore();
  }
}

function drawSingleButterfly(ctx) {
  // Ala izquierda superior
  ctx.fillStyle = '#FCD116';
  ctx.beginPath();
  ctx.ellipse(-14, -8, 12, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Ala derecha superior
  ctx.fillStyle = '#2ECC40';
  ctx.beginPath();
  ctx.ellipse(14, -8, 12, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Ala izquierda inferior
  ctx.fillStyle = '#FCD116';
  ctx.beginPath();
  ctx.ellipse(-10, 8, 9, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Ala derecha inferior
  ctx.fillStyle = '#2ECC40';
  ctx.beginPath();
  ctx.ellipse(10, 8, 9, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Cuerpo
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

module.exports = { generarCedula };
