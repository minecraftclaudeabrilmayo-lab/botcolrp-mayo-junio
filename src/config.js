// ============================================================
// CONFIGURACIÓN CENTRAL - Colombia Roleplay Bot
// ============================================================

module.exports = {
  // ── Canales ──────────────────────────────────────────────
  CHANNELS: {
    REGISTRO_CEDULAS:   '1505995899279511652', // Canal donde se registran las cédulas
    CREAR_DNI:          '1505995857445650522', // Canal para crear cédulas
    PANEL_POLICIAL:     '1505995936919326870', // Canal exclusivo de policías
    SOLICITUD_BORRAR:   '1505997166483738746', // Canal donde llegan solicitudes de borrado
  },

  // ── Roles ─────────────────────────────────────────────────
  ROLES: {
    POLICIA: [
      '1502815976222228500',
      '1502815974376866017',
      '1502815977409216645',
    ],
    CIUDADANO: '1502815998707892226',
    STAFF:     '1502815946795126884',
  },

  // ── Colores embed ─────────────────────────────────────────
  COLORS: {
    PRIMARY:  0xD4AF37, // Dorado Colombia
    SUCCESS:  0x2ECC71,
    ERROR:    0xE74C3C,
    WARNING:  0xF39C12,
    INFO:     0x3498DB,
  },

  // ── Roblox API ────────────────────────────────────────────
  ROBLOX: {
    USER_API:      'https://users.roblox.com/v1/users/search?keyword=',
    AVATAR_API:    'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=',
    AVATAR_PARAMS: '&size=420x420&format=Png&isCircular=false',
    USER_BY_NAME:  'https://users.roblox.com/v1/usernames/users',
  },
};
