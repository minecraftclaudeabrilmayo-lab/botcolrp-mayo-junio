// ============================================================
// COMANDO /panel-policial - Colombia Roleplay Bot
// ============================================================
const {
  SlashCommandBuilder, EmbedBuilder, AttachmentBuilder,
} = require('discord.js');

const config             = require('../config');
const db                 = require('../utils/database');
const { getRobloxAvatar, downloadImage } = require('../utils/roblox');
const { generarCedula }  = require('../utils/cedulaGenerator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-policial')
    .setDescription('👮 [POLICÍAS] Consulta la cédula de un ciudadano')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('@ del ciudadano a consultar')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('numero_personaje')
        .setDescription('Número de personaje a consultar')
        .setRequired(true)
        .addChoices(
          { name: 'Personaje 1', value: 1 },
          { name: 'Personaje 2', value: 2 }
        )
    ),

  async execute(interaction) {
    // ── Verificar canal ────────────────────────────────────────
    if (interaction.channelId !== config.CHANNELS.PANEL_POLICIAL) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('🚫 Canal incorrecto')
          .setDescription(`Este comando solo puede usarse en <#${config.CHANNELS.PANEL_POLICIAL}>.`)
        ],
        ephemeral: true,
      });
    }

    // ── Verificar rol de policía ───────────────────────────────
    const tieneRol = config.ROLES.POLICIA.some(id =>
      interaction.member.roles.cache.has(id)
    );
    if (!tieneRol) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('🚫 Acceso denegado')
          .setDescription('No tienes el rango necesario para utilizar el panel policial.')
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false });

    const objetivo        = interaction.options.getUser('usuario');
    const numeroPersonaje = interaction.options.getInteger('numero_personaje');

    const cedula = db.getCedula(objetivo.id, numeroPersonaje);

    if (!cedula) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.WARNING)
          .setTitle('📄 Sin cédula registrada')
          .setDescription(`El ciudadano <@${objetivo.id}> no tiene una cédula registrada para el **Personaje ${numeroPersonaje}**.`)
        ],
      });
    }

    // Regenerar imagen con avatar actual
    let avatarBuffer = null;
    if (cedula.roblox_id) {
      const avatarUrl = await getRobloxAvatar(cedula.roblox_id);
      if (avatarUrl) avatarBuffer = await downloadImage(avatarUrl);
    }

    let cedulaBuffer;
    try {
      cedulaBuffer = await generarCedula({
        nombres:         cedula.nombres,
        apellidos:       cedula.apellidos,
        fechaNacimiento: cedula.fecha_nacimiento,
        genero:          cedula.genero,
        lugarNacimiento: cedula.lugar_nacimiento,
        numeroCedula:    cedula.numero_cedula,
        avatarBuffer,
      });
    } catch {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Error')
          .setDescription('No se pudo generar la vista de la cédula.')
        ],
      });
    }

    const filename   = `cedula_policial_${cedula.numero_cedula}.png`;
    const attachment = new AttachmentBuilder(cedulaBuffer, { name: filename });

    const embed = new EmbedBuilder()
      .setColor(config.COLORS.INFO)
      .setTitle('👮 Panel Policial — Identificación')
      .setDescription(`Cédula verificada del ciudadano <@${objetivo.id}>`)
      .addFields(
        { name: '👤 Nombre Completo', value: `${cedula.nombres} ${cedula.apellidos}`, inline: true  },
        { name: '🪪 N° Cédula',       value: `\`${cedula.numero_cedula}\``,           inline: true  },
        { name: '⚧ Género',           value: cedula.genero === 'M' ? '🧔 Masculino' : '👩 Femenino', inline: true },
        { name: '🎂 Fecha Nac.',      value: cedula.fecha_nacimiento,                 inline: true  },
        { name: '📍 Lugar Nac.',      value: cedula.lugar_nacimiento,                 inline: true  },
        { name: '🎮 Roblox',          value: cedula.usuario_roblox,                   inline: true  },
        { name: '📁 Personaje',       value: `Personaje ${numeroPersonaje}`,           inline: true  },
        { name: '📅 Registrado',      value: new Date(cedula.creado_en).toLocaleDateString('es-CO'), inline: true },
      )
      .setImage(`attachment://${filename}`)
      .setFooter({
        text: `Consultado por ${interaction.user.tag} · Colombia Roleplay`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  },
};
