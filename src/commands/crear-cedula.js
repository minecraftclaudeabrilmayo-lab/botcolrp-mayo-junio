// ============================================================
// COMANDO /crear-cedula - Colombia Roleplay Bot
// ============================================================
const {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder,
  TextInputStyle, ActionRowBuilder, EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');

const config           = require('../config');
const db               = require('../utils/database');
const { getRobloxUser, getRobloxAvatar, downloadImage } = require('../utils/roblox');
const { generarCedula }  = require('../utils/cedulaGenerator');

// ── Helpers ───────────────────────────────────────────────
/** Capitaliza la primera letra de cada palabra */
function capitalize(str) {
  return str.trim().split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Valida formato DD/MM/YYYY */
function validarFecha(fecha) {
  const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const m  = fecha.match(re);
  if (!m) return false;
  const [, d, mo, y] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  if (y < 1900 || y > new Date().getFullYear()) return false;
  return true;
}

// ── Definición del comando ─────────────────────────────────
module.exports = {
  data: new SlashCommandBuilder()
    .setName('crear-cedula')
    .setDescription('Crea la cédula de identidad de tu personaje en Colombia RP')
    .addStringOption(opt =>
      opt.setName('usuario_roblox')
        .setDescription('Tu nombre de usuario exacto en Roblox')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('numero_personaje')
        .setDescription('Número de personaje (1 o 2)')
        .setRequired(true)
        .addChoices(
          { name: 'Personaje 1', value: 1 },
          { name: 'Personaje 2', value: 2 }
        )
    ),

  // ── Ejecución ─────────────────────────────────────────────
  async execute(interaction) {
    const usuarioRoblox   = interaction.options.getString('usuario_roblox');
    const numeroPersonaje = interaction.options.getInteger('numero_personaje');

    // Verificar si ya tiene cédula para ese personaje
    if (db.existeCedula(interaction.user.id, numeroPersonaje)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Cédula existente')
          .setDescription(`Ya tienes una cédula para el **Personaje ${numeroPersonaje}**.\nUsa \`/borrar-cedula\` si deseas eliminarla primero.`)
        ],
        ephemeral: true,
      });
    }

    // Mostrar modal con los campos
    const modal = new ModalBuilder()
      .setCustomId(`modal_cedula_${usuarioRoblox}_${numeroPersonaje}`)
      .setTitle(`📋 Datos del Personaje ${numeroPersonaje}`);

    const inputNombres = new TextInputBuilder()
      .setCustomId('nombres')
      .setLabel('Nombres')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ej: Juan Carlos')
      .setMinLength(2)
      .setMaxLength(50)
      .setRequired(true);

    const inputApellidos = new TextInputBuilder()
      .setCustomId('apellidos')
      .setLabel('Apellidos')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ej: García López')
      .setMinLength(2)
      .setMaxLength(50)
      .setRequired(true);

    const inputFecha = new TextInputBuilder()
      .setCustomId('fecha_nacimiento')
      .setLabel('Fecha de nacimiento (DD/MM/AAAA)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('15/04/2000')
      .setMinLength(10)
      .setMaxLength(10)
      .setRequired(true);

    const inputGenero = new TextInputBuilder()
      .setCustomId('genero')
      .setLabel('Género (M o F)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('M')
      .setMinLength(1)
      .setMaxLength(1)
      .setRequired(true);

    const inputLugar = new TextInputBuilder()
      .setCustomId('lugar_nacimiento')
      .setLabel('Lugar de nacimiento')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ej: Bogotá, Colombia')
      .setMinLength(2)
      .setMaxLength(60)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputNombres),
      new ActionRowBuilder().addComponents(inputApellidos),
      new ActionRowBuilder().addComponents(inputFecha),
      new ActionRowBuilder().addComponents(inputGenero),
      new ActionRowBuilder().addComponents(inputLugar),
    );

    await interaction.showModal(modal);
  },

  // ── Handler del modal ─────────────────────────────────────
  async handleModal(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Extraer datos del customId
    const parts         = interaction.customId.split('_');
    // formato: modal_cedula_{robloxUser}_{numPJ}
    const numeroPersonaje = parseInt(parts[parts.length - 1]);
    const usuarioRoblox   = parts.slice(2, parts.length - 1).join('_');

    // Leer respuestas del modal
    const nombresRaw  = interaction.fields.getTextInputValue('nombres');
    const apellidosRaw = interaction.fields.getTextInputValue('apellidos');
    const fechaRaw    = interaction.fields.getTextInputValue('fecha_nacimiento');
    const generoRaw   = interaction.fields.getTextInputValue('genero').toUpperCase();
    const lugarRaw    = interaction.fields.getTextInputValue('lugar_nacimiento');

    // ── Validaciones ─────────────────────────────────────────
    if (!validarFecha(fechaRaw)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Fecha inválida')
          .setDescription('El formato de fecha debe ser **DD/MM/AAAA** (ej: 15/04/2000).')
        ],
      });
    }

    if (!['M', 'F'].includes(generoRaw)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Género inválido')
          .setDescription('El género solo puede ser **M** (Masculino) o **F** (Femenino).')
        ],
      });
    }

    // Doble verificación de existencia (race condition)
    if (db.existeCedula(interaction.user.id, numeroPersonaje)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Cédula ya existente')
          .setDescription(`El personaje ${numeroPersonaje} ya tiene una cédula registrada.`)
        ],
      });
    }

    // ── Buscar usuario Roblox ─────────────────────────────────
    const robloxUser = await getRobloxUser(usuarioRoblox);
    if (!robloxUser) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Usuario Roblox no encontrado')
          .setDescription(`No se encontró el usuario **${usuarioRoblox}** en Roblox.\n\nVerifica que el nombre de usuario sea exacto y que la cuenta no esté banneada.`)
        ],
      });
    }

    // ── Obtener avatar Roblox ─────────────────────────────────
    const avatarUrl = await getRobloxAvatar(robloxUser.id);
    let avatarBuffer = null;
    let avatarOk    = false;

    if (avatarUrl) {
      avatarBuffer = await downloadImage(avatarUrl);
      if (avatarBuffer) avatarOk = true;
    }

    // ── Preparar datos finales ────────────────────────────────
    const nombres         = capitalize(nombresRaw);
    const apellidos       = capitalize(apellidosRaw);
    const lugarNacimiento = capitalize(lugarRaw);
    const numeroCedula    = db.getSiguienteNumeroCedula();

    // ── Generar imagen de la cédula ───────────────────────────
    let cedulaBuffer;
    try {
      cedulaBuffer = await generarCedula({
        nombres,
        apellidos,
        fechaNacimiento:  fechaRaw,
        genero:           generoRaw,
        lugarNacimiento,
        numeroCedula,
        avatarBuffer:     avatarOk ? avatarBuffer : null,
      });
    } catch (err) {
      console.error('[CEDULA GEN ERROR]', err);
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Error al generar la cédula')
          .setDescription('Ocurrió un error interno al generar la imagen. Por favor intenta más tarde.')
        ],
      });
    }

    // ── Guardar en base de datos ──────────────────────────────
    try {
      db.crearCedula({
        discordId:       interaction.user.id,
        numeroPersonaje,
        numeroCedula,
        nombres,
        apellidos,
        fechaNacimiento: fechaRaw,
        genero:          generoRaw,
        lugarNacimiento,
        usuarioRoblox:   robloxUser.name,
        robloxId:        robloxUser.id,
      });
    } catch (err) {
      console.error('[DB ERROR]', err);
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.ERROR)
          .setTitle('❌ Error al guardar')
          .setDescription('Hubo un error al guardar la cédula. Puede que ya tengas un personaje con ese número.')
        ],
      });
    }

    // ── Enviar al canal de registro ───────────────────────────
    const attachment   = new AttachmentBuilder(cedulaBuffer, { name: `cedula_${numeroCedula}.png` });
    const embedRegistro = new EmbedBuilder()
      .setColor(config.COLORS.PRIMARY)
      .setTitle('📋 Nueva Cédula Registrada')
      .setDescription(`**${nombres} ${apellidos}** — Personaje ${numeroPersonaje} de <@${interaction.user.id}>`)
      .addFields(
        { name: 'N° Cédula',      value: `\`${numeroCedula}\``,  inline: true },
        { name: 'Roblox',         value: robloxUser.name,          inline: true },
        { name: 'Género',         value: generoRaw,                inline: true },
        { name: 'F. Nacimiento',  value: fechaRaw,                 inline: true },
        { name: 'Lugar Nac.',     value: lugarNacimiento,          inline: true },
      )
      .setImage(`attachment://cedula_${numeroCedula}.png`)
      .setFooter({ text: `Colombia Roleplay · Registraduría Nacional` })
      .setTimestamp();

    try {
      const registroChannel = await interaction.client.channels.fetch(config.CHANNELS.REGISTRO_CEDULAS);
      if (registroChannel) await registroChannel.send({ embeds: [embedRegistro], files: [attachment] });
    } catch (err) {
      console.error('[REGISTRO CHANNEL ERROR]', err);
    }

    // ── Respuesta al usuario ──────────────────────────────────
    const attachment2 = new AttachmentBuilder(cedulaBuffer, { name: `cedula_${numeroCedula}.png` });
    const embedUser   = new EmbedBuilder()
      .setColor(config.COLORS.SUCCESS)
      .setTitle('✅ Cédula creada exitosamente')
      .setDescription(`Tu cédula del **Personaje ${numeroPersonaje}** ha sido generada y registrada.`)
      .setImage(`attachment://cedula_${numeroCedula}.png`)
      .setFooter({ text: 'Usa /ver-cedula para consultarla en cualquier momento.' });

    await interaction.editReply({ embeds: [embedUser], files: [attachment2] });

    // Aviso si el avatar no cargó
    if (!avatarOk) {
      await interaction.followUp({
        embeds: [new EmbedBuilder()
          .setColor(config.COLORS.WARNING)
          .setTitle('⚠️ Foto de perfil no disponible')
          .setDescription(
            'La foto de perfil de Roblox no pudo cargarse correctamente.\n\n' +
            '**¿Qué hacer?**\n' +
            '1. Asegúrate de tener la skin seleccionada en Roblox.\n' +
            '2. Retira cualquier accesorio que cubra tu cara (gafas, mascaras, cubre bocas, sombreros).\n' +
            '3. Reinicia Discord y Roblox.\n' +
            '4. Usa `/borrar-cedula` y vuelve a crearla con `/crear-cedula`.'
          )
        ],
        ephemeral: true,
      });
    }
  },
};
