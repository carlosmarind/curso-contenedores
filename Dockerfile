# esta es la imagen que tomo como base para partir a construir la mia, podria ser cualquiera
# pero me conviene una con node, ya que mi aplicacion necesita node
# para instalar las dependencias, construirla y ejecutarla
FROM node:24 AS construccion

# Directorio de trabajo donde me paro a ejecutar comandos
WORKDIR /usr/app

#habilito corepack que me permite usar pnpm en lugar npm para descargar las dependencias y construir
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# instalo las dependencias y agrego el modificador para que no busque nuevas versiones
RUN pnpm install --frozen-lockfile

# copio del host a la imagen en formato COPY origen_host destino_imagen
# las rutas son relativas tanto el host como en imagen ( al workdir)
COPY nest-cli.json tsconfig*.json ./
COPY src ./src

# construyo la version final de la aplicacion ( carpeta dist/ )
RUN pnpm build


FROM node:24 AS dependencias-produccion

WORKDIR /usr/app

RUN corepack enable

# Usamos los mismos archivos de dependencias, pero con --prod
# para instalar solamente lo necesario en ejecucion.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile


FROM node:24-alpine AS runner

WORKDIR /usr/app

COPY --from=construccion /usr/app/package.json ./
COPY --from=construccion /usr/app/dist ./dist
COPY --from=dependencias-produccion /usr/app/node_modules ./node_modules

# le digo a la imagen cual es el comando que debe ejecutar
# al iniciar el contenedor.
CMD ["node", "dist/main.js"]