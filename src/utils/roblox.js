// ============================================================
// ROBLOX API HELPER - Colombia Roleplay Bot
// ============================================================
const axios  = require('axios');
const config = require('../config');

/**
 * Busca un usuario de Roblox por nombre de usuario.
 * Devuelve { id, name } o null si no se encuentra.
 */
async function getRobloxUser(username) {
  try {
    const { data } = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: true },
      { timeout: 8000 }
    );
    if (data.data && data.data.length > 0) {
      return { id: String(data.data[0].id), name: data.data[0].name };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene la URL del avatar headshot de un usuario de Roblox.
 * Devuelve la URL de imagen o null.
 */
async function getRobloxAvatar(robloxId) {
  try {
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png&isCircular=false`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (data.data && data.data.length > 0 && data.data[0].imageUrl) {
      return data.data[0].imageUrl;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Descarga una imagen desde una URL y devuelve un Buffer.
 */
async function downloadImage(url) {
  try {
    const { data } = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(data);
  } catch {
    return null;
  }
}

module.exports = { getRobloxUser, getRobloxAvatar, downloadImage };
