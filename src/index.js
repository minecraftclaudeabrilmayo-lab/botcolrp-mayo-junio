// ============================================================
// ENTRY POINT - Colombia Roleplay Bot
// ============================================================
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ── Validar variables de entorno ──────────────────────────
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN no definido en .env');
  process.exit(1);
}

// ── Crear cliente ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

// ── Colección de comandos ─────────────────────────────────
client.commands = new Collection();
const cmdPath   = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(cmdPath, file));
  if (cmd.data) client.commands.set(cmd.data.name, cmd);
}

// ── Cargar eventos ────────────────────────────────────────
const evtPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(evtPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(evtPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// ── Manejo de errores global ──────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

// ── Auto-deploy de comandos al iniciar ───────────────────
const { REST, Routes } = require('discord.js');

async function deployCommands() {
  try {
    const commandsData = [...client.commands.values()].map(c => c.data.toJSON());
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandsData }
    );
    console.log(`✅ ${commandsData.length} comando(s) registrados automáticamente.`);
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
}

// ── Login ─────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).then(() => deployCommands());
