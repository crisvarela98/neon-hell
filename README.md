# NEON HELL

NEON HELL es un FPS retro cyberpunk para navegador inspirado por Doom clasico, Wolfenstein 3D y los boomer shooters. Esta version incluye menu principal, modo historia con tres misiones iniciales, registro/login opcional, supervivencia por oleadas, jefe de nivel, cuatro armas, power-ups temporales, raycasting en Canvas 2D, enemigos, puertas interactivas, HUD arcade, minimapa, pickups, audio sintetico, online PvE por sala y ranking global persistido en MongoDB Atlas.

## Tecnologias

- Frontend: Vite, HTML, CSS, JavaScript puro, Canvas 2D
- Backend: Node.js, Express, Socket.IO
- Base de datos: MongoDB Atlas con Mongoose
- Auth: bcryptjs y JSON Web Tokens

## Estructura de deploy

- `server`: backend Node.js para Render
- `web-client`: frontend Vite para Vercel
- `public`: version legacy/local previa del cliente

## Instalacion

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd web-client
npm install
```

## Configuracion MongoDB

El backend lee la conexion exclusivamente desde variables de entorno.

1. Crea un archivo `.env` en `server` o usa el `.env` de la raiz para desarrollo local.
2. Usa una URI valida de MongoDB Atlas en `MONGODB_URI`.
3. Define una clave fuerte en `JWT_SECRET`.
4. Define la URL final de Vercel en `CLIENT_URL`.

Ejemplo:

```env
PORT=3000
MONGODB_URI=mongodb+srv://crisvareladev_db_user:MHxxccXFmiIiBwZA@neon-hell.hyhk0z2.mongodb.net/?appName=Neon-hell
CLIENT_URL=https://tu-app.vercel.app
JWT_SECRET=change_this_secret
NODE_ENV=production
```

## Variables de entorno

Backend Render:

- `PORT`: puerto HTTP del servidor
- `MONGODB_URI`: conexion de MongoDB Atlas
- `CLIENT_URL`: URL publica del frontend en Vercel
- `JWT_SECRET`: firma para tokens de login
- `NODE_ENV`: usar `production`

Frontend Vercel:

- `VITE_SERVER_URL`: URL publica del backend en Render

## Ejecucion

Backend local:

```bash
npm run dev:server
```

Frontend local:

```bash
npm run dev:web
```

Para registrarte en local tienen que estar corriendo los dos procesos: backend en `http://localhost:3000` y frontend en `http://localhost:5173`. El servidor solo inicia cuando MongoDB esta conectado. Si Atlas se desconecta, se registra el error y se programa una reconexion basica. En desarrollo, `web-client/vite.config.js` redirige `/api` y Socket.IO hacia `http://localhost:3000`. En produccion, el cliente usa `VITE_SERVER_URL`; no se usa `localhost`.

## Deploy Render

Crear un Web Service desde este repo:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`

Variables en Render:

```env
MONGODB_URI=
CLIENT_URL=https://tu-app.vercel.app
JWT_SECRET=una_clave_larga_y_privada
NODE_ENV=production
```

Cuando Render entregue la URL publica, por ejemplo `https://neon-hell-api.onrender.com`, usala en Vercel como `VITE_SERVER_URL`.

## Deploy Vercel

Crear el proyecto desde este repo:

- Root directory: `web-client`
- Build command: `npm run build`
- Output directory: `dist`

Variables en Vercel:

```env
VITE_SERVER_URL=https://tu-backend.onrender.com
```

Despues de desplegar Vercel, copia su URL final y pegala en Render como `CLIENT_URL`. Esto habilita CORS para API y Socket.IO.

## Controles

PC:

- `W / S`: avanzar y retroceder
- `A / D`: desplazamiento lateral
- `Mouse` o `Flechas`: mirar izquierda y derecha
- `Click` o `Espacio`: disparar
- `E`: abrir puertas
- `Q`: cambiar arma
- `M`: alternar minimapa

Celular:

- Joystick virtual para avanzar, retroceder y desplazamiento lateral
- Botones tactiles para girar izquierda, girar derecha y disparar
- Boton `USE` para abrir puertas
- Boton `SWAP` para cambiar arma

## Historia y misiones

- Modo historia visible desde el menu sin obligar al usuario a completar onboarding
- Mision 01 `BOOT BAY`: primera mision jugable con una oleada corta
- Mision 02 `SECTOR 13`: corredor de acceso con dos oleadas
- Mision 03 `BREACH CORE`: camara de fractura con jefe `ARCHON PRIME`

## Direccion visual

La paleta de `NEON HELL` queda restringida a:

- Fondo y estructuras: `#000000` y `#121214`
- Energia y luces guia: `#00FFFF`
- Peligro, enemigos y sangre: `#FF00FF` y `#FF0055`
- Interfaz y HUD: `#39FF14`

El frontend usa esta paleta en menus, HUD, pickups, enemigos, armas, muzzle flash, minimapa y render del raycaster.

## Online PvE

- Modo `Online equipo vs maquina` desde el menu principal
- Requiere usuario logueado
- Un jugador crea sala y comparte el codigo
- Hasta 4 operadores pueden entrar a la misma sala
- El host inicia la partida para todo el equipo
- Socket.IO sincroniza roster, presencia de companeros, estado basico y disparos

## Gameplay extra

- Pickups de `health`, `ammo` y `overcharge`
- Power-ups temporales `fury`, `shield` y `arsenal`
- Tres misiones iniciales: `BOOT BAY`, `SECTOR 13` y `BREACH CORE`
- Jefe `ARCHON PRIME` en waves especiales del segundo nivel
- Cuatro armas jugables: `Volt Repeater`, `Shard Shotgun`, `Rift Carbine` y `Hellburst`
- Arte raster propio en `public/assets/images`
- Musica loop y SFX propios en `public/assets/music` y `public/assets/sounds`
- Briefing previo a la partida y archivo de lore en menu
- Objetivos por nivel visibles en HUD durante la corrida
- Puertas neon interactivas en el mapa
- Minimapa integrado en pantalla con toggle
- Audio synth generado con Web Audio API
- IA con separacion basica para reducir amontonamiento
- Sangre pixelada en kills y dano recibido
- Sala online PvE en memoria con Socket.IO

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/scores/top`
- `POST /api/scores`

## Proximas mejoras

- Mas niveles y puertas interactivas
- Sonidos y musica originales
- Multiplayer real sobre Socket.IO
- Power-ups y armas secundarias
- Mejores sprites y efectos pixel art
