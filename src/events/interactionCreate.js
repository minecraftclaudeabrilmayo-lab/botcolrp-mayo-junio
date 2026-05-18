// ============================================================
// EVENTO interactionCreate - Colombia Roleplay Bot
// ============================================================
const { Events } = require('discord.js');

const crearCedula  = require('../commands/crear-cedula');
const borrarCedula = require('../commands/borrar-cedula');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // ── Slash Commands ─────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[CMD ERROR] /${interaction.commandName}:`, err);
        const msg = { content: '❌ Ocurrió un error ejecutando este comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    // ── Modals ─────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      try {
        // Modal de cédula
        if (interaction.customId.startsWith('modal_cedula_')) {
          return await crearCedula.handleModal(interaction);
        }
        // Modal de motivo de aprobación de borrado
        if (interaction.customId.startsWith('motivo_aprobacion_')) {
          return await borrarCedula.handleMotivoModal(interaction);
        }
      } catch (err) {
        console.error('[MODAL ERROR]', err);
        const msg = { content: '❌ Error procesando el formulario.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    // ── Buttons ────────────────────────────────────────────────
    if (interaction.isButton()) {
      try {
        if (
          interaction.customId.startsWith('aprobar_borrado_') ||
          interaction.customId.startsWith('rechazar_borrado_')
        ) {
          return await borrarCedula.handleButton(interaction);
        }
      } catch (err) {
        console.error('[BUTTON ERROR]', err);
        await interaction.reply({ content: '❌ Error procesando la acción.', ephemeral: true }).catch(() => {});
      }
      return;
    }
  },
};
