# esta es la imagen que tomo como base para partir a construir la mia, podria ser cualquiera
# pero me conviene una con node, ya que mi aplicacion necesita node
# para instalar las dependencias, construirla y ejecutarla
FROM node:24

# Directorio de trabajo donde me paro a ejecutar comandos
WORKDIR /usr/app

#habilito corepack que me permite usar pnpm en lugar npm para descargar las dependencias y construir
RUN corepack enable

# copio del host a la imagen en formato COPY origen_host destino_imagen
# las rutas son relativas tanto el host como en imagen ( al workdir)
COPY . .

# instalo las dependencias y agrego el modificador para que no busque nuevas versiones
RUN pnpm install --frozen-lockfile

# construyo la version final de la aplicacion ( carpeta dist/ )
RUN pnpm build

# le digo a la imagen cual es el comando que debe ejecutar
# al iniciar el contenedor.
CMD ["node", "dist/main.js"]