// ============================================================
// DEPLOY DE COMANDOS - Colombia Roleplay Bot
// Ejecutar: node src/deploy-commands.js
// ============================================================
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];
const cmdPath  = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(cmdPath, file));
  if (cmd.data) commands.push(cmd.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registrando ${commands.length} comando(s)...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log(`✅ ${data.length} comando(s) registrados correctamente.`);
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
    process.exit(1);
  }
})();
