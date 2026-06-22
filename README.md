# NEON HELL

NEON HELL es un FPS retro cyberpunk para navegador inspirado por Doom clasico, Wolfenstein 3D y los boomer shooters. Esta version incluye menu principal, FTUE, registro/login, tres misiones iniciales, supervivencia por oleadas, jefe de nivel, cuatro armas, power-ups temporales, raycasting en Canvas 2D, enemigos, puertas interactivas, HUD arcade, minimapa, pickups, audio sintetico, online PvE por sala y ranking global persistido en MongoDB Atlas.

## Tecnologias

- Frontend: HTML, CSS, JavaScript puro, Canvas 2D
- Backend: Node.js, Express, Socket.IO
- Base de datos: MongoDB Atlas con Mongoose
- Auth: bcryptjs y JSON Web Tokens

## Instalacion

```bash
npm install
```

## Configuracion MongoDB

La aplicacion lee la conexion exclusivamente desde variables de entorno.

1. Crea un archivo `.env` en la raiz del proyecto.
2. Usa una URI valida de MongoDB Atlas en `MONGODB_URI`.
3. Define una clave fuerte en `JWT_SECRET`.

Ejemplo:

```env
PORT=3000
MONGODB_URI=mongodb+srv://crisvareladev_db_user:MHxxccXFmiIiBwZA@neon-hell.hyhk0z2.mongodb.net/?appName=Neon-hell
JWT_SECRET=change_this_secret
```

## Variables de entorno

- `PORT`: puerto HTTP del servidor
- `MONGODB_URI`: conexion de MongoDB Atlas
- `JWT_SECRET`: firma para tokens de login

## Ejecucion

Desarrollo:

```bash
npm run dev
```

Produccion:

```bash
npm start
```

El servidor solo inicia cuando MongoDB esta conectado. Si Atlas se desconecta, se registra el error y se programa una reconexion basica.

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

- Botones tactiles para avanzar, retroceder, girar izquierda, girar derecha y disparar
- Boton `USE` para abrir puertas
- Boton `SWAP` para cambiar arma

## FTUE y misiones

- FTUE con ruta de operador: registro, entrenamiento, campana y online PvE
- Mision 01 `BOOT BAY`: tutorial jugable con una oleada corta
- Mision 02 `SECTOR 13`: corredor de acceso con dos oleadas
- Mision 03 `BREACH CORE`: camara de fractura con jefe `ARCHON PRIME`

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
