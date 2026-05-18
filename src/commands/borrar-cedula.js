// ============================================================
// COMANDO /borrar-cedula - Colombia Roleplay Bot
// ============================================================
const {
  SlashCommandBuilder, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const config = require('../config');
const db     = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('borrar-cedula')
    .setDescription('Solicita la eliminación de tu cédula (requiere aprobación del staff)')
    .addIntegerOption(opt =>
      opt.setName('numero_personaje')
        .setDescription('Personaje cuya cédula deseas eliminar')
        .setRequired(true)
        .addChoices(
          { name: 'Personaje 1', value: 1 },
          { name: 'Personaje 2', value: 2 }
        )
    ),

  async execute(interaction) {
    const numeroPersonaje = interaction.options.getInteger('numero_personaje');
    const cedula = db.getCedula(interaction.user.id, numeroPersonaje);

    if (!cedula) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.WARNING)
          .setTitle('⚠️ Sin cédula')
          .setDescription(`No tienes una cédula registrada para el **Personaje ${numeroPersonaje}**.`)
        ],
        ephemeral: true,
      });
    }

    // Enviar solicitud al canal de staff
    const embedSolicitud = new EmbedBuilder()
      .setColor(config.COLORS.WARNING)
      .setTitle('🗑️ Solicitud de Eliminación de Cédula')
      .setDescription(`<@${interaction.user.id}> solicita eliminar su cédula del **Personaje ${numeroPersonaje}**.`)
      .addFields(
        { name: 'Usuario Discord', value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`, inline: false },
        { name: 'Personaje',       value: `Personaje ${numeroPersonaje}`,                             inline: true  },
        { name: 'N° Cédula',       value: `\`${cedula.numero_cedula}\``,                             inline: true  },
        { name: 'Nombre',          value: `${cedula.nombres} ${cedula.apellidos}`,                   inline: true  },
        { name: 'Roblox',          value: cedula.usuario_roblox,                                      inline: true  },
      )
      .setFooter({ text: 'Colombia Roleplay · Staff Panel' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aprobar_borrado_${interaction.user.id}_${numeroPersonaje}`)
        .setLabel('✅ Aprobar eliminación')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`rechazar_borrado_${interaction.user.id}_${numeroPersonaje}`)
        .setLabel('❌ Rechazar')
        .setStyle(ButtonStyle.Danger),
    );

    let mensajeEnviado;
    try {
      const staffChannel = await interaction.client.channels.fetch(config.CHANNELS.SOLICITUD_BORRAR);
      mensajeEnviado = await staffChannel.send({ embeds: [embedSolicitud], components: [row] });
    } catch (err) {
      console.error('[STAFF CHANNEL ERROR]', err);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Error')
          .setDescription('No se pudo enviar la solicitud al staff. Contacta a un administrador.')
        ],
        ephemeral: true,
      });
    }

    // Guardar solicitud en la DB
    db.crearSolicitudBorrado({
      discordId:       interaction.user.id,
      numeroPersonaje,
      numeroCedula:    cedula.numero_cedula,
      mensajeId:       mensajeEnviado.id,
    });

    // Confirmar al usuario (ephemeral)
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor(config.COLORS.INFO)
        .setTitle('📨 Solicitud enviada')
        .setDescription(
          'Tu solicitud para eliminar la cédula fue enviada correctamente a la moderación.\n\n' +
          'Recibirás un mensaje directo cuando el staff tome una decisión.'
        )
      ],
      ephemeral: true,
    });
  },

  // ── Handler de botones de aprobación / rechazo ─────────────
  async handleButton(interaction) {
    // Verificar que sea staff
    const hasStaff = interaction.member.roles.cache.has(config.ROLES.STAFF);
    if (!hasStaff) {
      return interaction.reply({
        content: '❌ No tienes permisos para gestionar solicitudes de borrado.',
        ephemeral: true,
      });
    }

    const parts         = interaction.customId.split('_');
    const accion        = parts[0]; // 'aprobar' o 'rechazar'
    const discordId     = parts[2];
    const numPersonaje  = parseInt(parts[3]);

    const solicitud = db.getSolicitudPorMensaje(interaction.message.id);
    if (!solicitud) {
      return interaction.reply({
        content: '⚠️ Esta solicitud ya fue procesada o no existe.',
        ephemeral: true,
      });
    }

    if (accion === 'aprobar') {
      // Pedir motivo via modal
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ARB } = require('discord.js');
      const modal = new ModalBuilder()
        .setCustomId(`motivo_aprobacion_${solicitud.id}`)
        .setTitle('Motivo de aprobación');
      modal.addComponents(
        new ARB().addComponents(
          new TextInputBuilder()
            .setCustomId('motivo')
            .setLabel('Motivo de la eliminación')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Explica por qué se aprueba la eliminación...')
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);

    } else {
      // Rechazar directamente
      db.actualizarEstadoSolicitud(solicitud.id, 'rechazada');

      // Notificar al usuario
      try {
        const usuario = await interaction.client.users.fetch(discordId);
        await usuario.send({
          embeds: [new EmbedBuilder()
            .setColor(config.COLORS.ERROR)
            .setTitle('❌ Solicitud de eliminación rechazada')
            .setDescription(
              `Tu solicitud para eliminar el **Personaje ${numPersonaje}** fue **rechazada** por el staff.\n` +
              'Si tienes dudas, contacta a un moderador.'
            )
          ],
        });
      } catch { /* DM bloqueado */ }

      // Editar el mensaje del staff
      const embedActualizado = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(config.COLORS.ERROR)
        .setTitle('🗑️ Solicitud RECHAZADA')
        .setFooter({ text: `Rechazada por ${interaction.user.tag}` });

      await interaction.update({ embeds: [embedActualizado], components: [] });
    }
  },

  // ── Handler del modal de motivo de aprobación ─────────────
  async handleMotivoModal(interaction) {
    const solicitudId = parseInt(interaction.customId.split('_')[2]);
    const motivo      = interaction.fields.getTextInputValue('motivo');

    // Buscar la solicitud
    const solicitud = interaction.client.db?.getSolicitudById?.(solicitudId)
      || (() => {
        // fallback: buscar por mensaje
        const { db: dbInst } = require('../utils/database');
        return dbInst.prepare('SELECT * FROM solicitudes_borrado WHERE id = ?').get(solicitudId);
      })();

    if (!solicitud) {
      return interaction.reply({ content: '⚠️ Solicitud no encontrada.', ephemeral: true });
    }

    // Eliminar la cédula
    db.eliminarCedula(solicitud.discord_id, solicitud.numero_personaje);
    db.actualizarEstadoSolicitud(solicitudId, 'aprobada');

    // Notificar al usuario por MD
    try {
      const usuario = await interaction.client.users.fetch(solicitud.discord_id);
      await usuario.send({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.SUCCESS)
          .setTitle('✅ Cédula eliminada')
          .setDescription(
            `El **Personaje ${solicitud.numero_personaje}** ha sido eliminado.\n\n` +
            `**Motivo del staff:** ${motivo}\n\n` +
            `Puedes crear una nueva cédula cuando lo desees usando \`/crear-cedula\`.`
          )
        ],
      });
    } catch { /* DM bloqueado */ }

    // Editar el mensaje del staff
    await interaction.update({
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(config.COLORS.SUCCESS)
          .setTitle('🗑️ Solicitud APROBADA — Cédula eliminada')
          .setFooter({ text: `Aprobada por ${interaction.user.tag} · Motivo: ${motivo.slice(0, 80)}` }),
      ],
      components: [],
    });
  },
};
