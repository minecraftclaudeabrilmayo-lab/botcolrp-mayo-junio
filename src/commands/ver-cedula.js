// ============================================================
// COMANDO /ver-cedula - Colombia Roleplay Bot
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
    .setName('ver-cedula')
    .setDescription('Visualiza tu cédula de identidad (solo visible para ti)')
    .addIntegerOption(opt =>
      opt.setName('numero_personaje')
        .setDescription('¿Qué cédula deseas ver?')
        .setRequired(true)
        .addChoices(
          { name: 'Personaje 1', value: 1 },
          { name: 'Personaje 2', value: 2 }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const numeroPersonaje = interaction.options.getInteger('numero_personaje');
    const cedula = db.getCedula(interaction.user.id, numeroPersonaje);

    if (!cedula) {
      const embedNoExiste = new EmbedBuilder()
        .setColor(config.COLORS.WARNING)
        .setTitle('📄 No tienes cédula registrada')
        .setDescription(
          `No tienes una cédula creada para el **Personaje ${numeroPersonaje}**.\n\n` +
          `Puedes crear una en <#${config.CHANNELS.CREAR_DNI}> usando el comando \`/crear-cedula\`.`
        );
      return interaction.editReply({ embeds: [embedNoExiste] });
    }

    // Regenerar imagen con el avatar actual
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
          .setDescription('No se pudo generar la vista de la cédula. Intenta más tarde.')
        ],
      });
    }

    const filename   = `cedula_${cedula.numero_cedula}.png`;
    const attachment = new AttachmentBuilder(cedulaBuffer, { name: filename });
    const embed      = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle(`🪪 Cédula — Personaje ${numeroPersonaje}`)
      .setDescription(`**${cedula.nombres} ${cedula.apellidos}** | N° \`${cedula.numero_cedula}\``)
      .setImage(`attachment://${filename}`)
      .setFooter({ text: 'Colombia Roleplay · Cédula de Ciudadanía' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });
  },
};
