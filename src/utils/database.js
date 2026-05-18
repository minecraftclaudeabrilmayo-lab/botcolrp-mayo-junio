// ============================================================
// BASE DE DATOS SQLite - Colombia Roleplay Bot
// ============================================================
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH = path.join(__dirname, '../../data/cedulas.db');

// Asegurar que la carpeta existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// ── Inicialización de tablas ──────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS cedulas (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id      TEXT    NOT NULL,
    numero_personaje INTEGER NOT NULL CHECK(numero_personaje IN (1,2)),
    numero_cedula   TEXT    NOT NULL UNIQUE,
    nombres         TEXT    NOT NULL,
    apellidos       TEXT    NOT NULL,
    fecha_nacimiento TEXT   NOT NULL,
    genero          TEXT    NOT NULL CHECK(genero IN ('M','F')),
    lugar_nacimiento TEXT   NOT NULL,
    usuario_roblox  TEXT    NOT NULL,
    roblox_id       TEXT,
    creado_en       TEXT    DEFAULT (datetime('now')),
    UNIQUE(discord_id, numero_personaje)
  );

  CREATE TABLE IF NOT EXISTS contador_cedulas (
    id      INTEGER PRIMARY KEY CHECK(id = 1),
    ultimo  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS solicitudes_borrado (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id      TEXT    NOT NULL,
    numero_personaje INTEGER NOT NULL,
    numero_cedula   TEXT    NOT NULL,
    estado          TEXT    NOT NULL DEFAULT 'pendiente',
    mensaje_id      TEXT,
    creado_en       TEXT    DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO contador_cedulas (id, ultimo) VALUES (1, 0);
`);

// ── Funciones de cédulas ──────────────────────────────────

/** Obtiene el siguiente número de cédula formateado (ej: 0004) */
function getSiguienteNumeroCedula() {
  const row = db.prepare('SELECT ultimo FROM contador_cedulas WHERE id = 1').get();
  const siguiente = (row?.ultimo ?? 0) + 1;
  db.prepare('UPDATE contador_cedulas SET ultimo = ? WHERE id = 1').run(siguiente);
  return String(siguiente).padStart(4, '0');
}

/** Crea una cédula nueva */
function crearCedula({ discordId, numeroPersonaje, numeroCedula, nombres, apellidos,
  fechaNacimiento, genero, lugarNacimiento, usuarioRoblox, robloxId }) {
  return db.prepare(`
    INSERT INTO cedulas
      (discord_id, numero_personaje, numero_cedula, nombres, apellidos,
       fecha_nacimiento, genero, lugar_nacimiento, usuario_roblox, roblox_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(discordId, numeroPersonaje, numeroCedula, nombres, apellidos,
         fechaNacimiento, genero, lugarNacimiento, usuarioRoblox, robloxId);
}

/** Obtiene una cédula por discord_id y número de personaje */
function getCedula(discordId, numeroPersonaje) {
  return db.prepare(
    'SELECT * FROM cedulas WHERE discord_id = ? AND numero_personaje = ?'
  ).get(discordId, numeroPersonaje);
}

/** Obtiene todas las cédulas de un usuario */
function getCedulasUsuario(discordId) {
  return db.prepare('SELECT * FROM cedulas WHERE discord_id = ?').all(discordId);
}

/** Elimina una cédula */
function eliminarCedula(discordId, numeroPersonaje) {
  return db.prepare(
    'DELETE FROM cedulas WHERE discord_id = ? AND numero_personaje = ?'
  ).run(discordId, numeroPersonaje);
}

/** Verifica si ya existe un personaje con ese número para ese usuario */
function existeCedula(discordId, numeroPersonaje) {
  return !!db.prepare(
    'SELECT id FROM cedulas WHERE discord_id = ? AND numero_personaje = ?'
  ).get(discordId, numeroPersonaje);
}

// ── Funciones de solicitudes de borrado ───────────────────

function crearSolicitudBorrado({ discordId, numeroPersonaje, numeroCedula, mensajeId }) {
  return db.prepare(`
    INSERT INTO solicitudes_borrado (discord_id, numero_personaje, numero_cedula, mensaje_id)
    VALUES (?, ?, ?, ?)
  `).run(discordId, numeroPersonaje, numeroCedula, mensajeId);
}

function getSolicitudPorMensaje(mensajeId) {
  return db.prepare(
    'SELECT * FROM solicitudes_borrado WHERE mensaje_id = ? AND estado = \'pendiente\''
  ).get(mensajeId);
}

function actualizarEstadoSolicitud(id, estado) {
  return db.prepare('UPDATE solicitudes_borrado SET estado = ? WHERE id = ?').run(estado, id);
}

module.exports = {
  db,
  getSiguienteNumeroCedula,
  crearCedula,
  getCedula,
  getCedulasUsuario,
  eliminarCedula,
  existeCedula,
  crearSolicitudBorrado,
  getSolicitudPorMensaje,
  actualizarEstadoSolicitud,
};
