# Curso de Contenedores - API NestJS.......

Este repositorio contiene el proyecto base que utilizaremos durante el curso.
La aplicacion esta desarrollada con NestJS y TypeScript, y se ira ampliando
clase a clase a medida que incorporemos nuevos conceptos.

## Requisitos

- Node.js 24 LTS, version 24.15.0 o superior dentro de la rama 24
- pnpm 11

El proyecto declara `pnpm@11.1.2` como gestor de paquetes.
Utiliza NestJS 12, TypeScript 6 y TypeORM 1. Las imagenes Docker y los agentes
Node de Jenkins usan `node:24.21.0-bookworm-slim`.
Los scripts de pruebas habilitan los modulos VM de Node para cargar los
paquetes ESM de NestJS 12 con Jest.

## Instalacion

Habilita pnpm e instala las dependencias:

```bash
corepack enable
pnpm install --frozen-lockfile
```

## Ejecutar la aplicacion

Inicia la aplicacion en modo desarrollo:

```bash
pnpm run start:dev
```

La API quedara disponible en `http://localhost:3000`.

## Endpoints iniciales

```text
GET /hello
GET /hi
```

Puedes probarlos desde otra terminal:

```bash
curl http://localhost:3000/hello
curl http://localhost:3000/hi
```

## Comandos utiles

```bash
pnpm run lint
pnpm run test
pnpm run build
```

## Estructura inicial

- `src/main.ts`: inicia la aplicacion NestJS.
- `src/app.module.ts`: define el modulo principal.
- `src/app.controller.ts`: expone los endpoints iniciales.
- `src/app.service.ts`: contiene la logica utilizada por el controlador.

Este README se actualizara durante el curso para documentar cada nuevo tema.
