// ============================================================
// EVENTO ready - Colombia Roleplay Bot
// ============================================================
const { Events, ActivityType } = require('discord.js');

module.exports = {
  name:  Events.ClientReady,
  once:  true,

  execute(client) {
    console.log(`\n✅ Bot conectado como: ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`🤖 ID del bot: ${client.user.id}\n`);

    // Estado del perfil: Colombia Roleplay
    client.user.setPresence({
      activities: [{
        name:  'Colombia Roleplay',
        type:  ActivityType.Watching,
      }],
      status: 'online',
    });
  },
};
