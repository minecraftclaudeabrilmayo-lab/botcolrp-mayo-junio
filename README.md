# 🇨🇴 Colombia Roleplay — Bot de Cédulas

Bot de Discord para la gestión automática de cédulas de ciudadanía en servidores de roleplay colombiano.

---

## 📋 Comandos disponibles

| Comando | Descripción |
|---|---|
| `/crear-cedula` | Crea la cédula de tu personaje |
| `/ver-cedula` | Visualiza tu cédula (mensaje privado) |
| `/borrar-cedula` | Solicita eliminar tu cédula (requiere staff) |
| `/panel-policial` | Consulta cédulas de ciudadanos (solo policías) |

---

## ⚙️ Instalación

### 1. Prerrequisitos

- Node.js **v18 o superior**
- npm

### 2. Clonar y configurar

```bash
git clone <tu-repo>
cd cedulas-bot
npm install
cp .env.example .env
```

### 3. Completar el `.env`

```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=id_de_tu_aplicacion
GUILD_ID=id_de_tu_servidor
```

Para obtener estos valores:
- **DISCORD_TOKEN**: [Discord Developer Portal](https://discord.com/developers/applications) → Tu app → Bot → Token
- **CLIENT_ID**: Developer Portal → Tu app → General Information → Application ID
- **GUILD_ID**: En Discord, activa el Modo Desarrollador (Ajustes → Avanzado), luego clic derecho en tu servidor → Copiar ID

### 4. Registrar comandos

```bash
npm run deploy
```

### 5. Iniciar el bot

```bash
npm start
```

---

## 🚂 Hosting en Railway

1. Sube el código a GitHub (sin el archivo `.env`)
2. En [railway.app](https://railway.app), crea un nuevo proyecto → "Deploy from GitHub repo"
3. En la sección **Variables**, agrega las mismas variables de tu `.env`:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
4. Railway detecta automáticamente Node.js. El bot arrancará con `npm start`.

> **Nota:** La base de datos SQLite (`data/cedulas.db`) se crea automáticamente. En Railway, los archivos persisten en el mismo deployment. Para mayor persistencia en producción, considera usar **Railway Volume** o migrar a PostgreSQL.

---

## 📁 Estructura del proyecto

```
cedulas-bot/
├── src/
│   ├── commands/
│   │   ├── crear-cedula.js      # /crear-cedula
│   │   ├── ver-cedula.js        # /ver-cedula
│   │   ├── borrar-cedula.js     # /borrar-cedula
│   │   └── panel-policial.js    # /panel-policial
│   ├── events/
│   │   ├── ready.js             # Evento de inicio
│   │   └── interactionCreate.js # Gestión de interacciones
│   ├── utils/
│   │   ├── database.js          # Base de datos SQLite
│   │   ├── roblox.js            # API de Roblox
│   │   └── cedulaGenerator.js   # Generador de imagen Canvas
│   ├── config.js                # IDs de canales y roles
│   ├── deploy-commands.js       # Script de registro de comandos
│   └── index.js                 # Entry point
├── data/                        # (auto-creado) Base de datos
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔧 Configuración de IDs

Todos los IDs de canales y roles se encuentran en `src/config.js`. Si necesitas cambiarlos, edita ese archivo.

| Elemento | ID |
|---|---|
| Canal registro cédulas | `1505995899279511652` |
| Canal crear DNI | `1505995857445650522` |
| Canal panel policial | `1505995936919326870` |
| Canal solicitudes borrado | `1505997166483738746` |
| Rol ciudadano | `1502815998707892226` |
| Rol staff | `1502815946795126884` |
| Roles policía | `1502815976222228500`, `1502815974376866017`, `1502815977409216645` |

---

## ⚠️ Permisos requeridos del bot

En el Discord Developer Portal, activa los siguientes permisos del bot:
- `Send Messages`
- `Attach Files`
- `Use Slash Commands`
- `Read Message History`
- `Send Messages in Threads`

Y en **Privileged Gateway Intents**:
- `Server Members Intent`

---

## 📞 Soporte

Si el bot tiene problemas al generar cédulas, verifica:
1. Que `canvas` esté instalado correctamente (`npm install canvas`)
2. Que el usuario de Roblox exista y no tenga la cuenta en privado
3. Que el token del bot tenga los permisos correctos
