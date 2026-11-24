# Curso de Contenedores - API NestJS

Base de la aplicacion para el modulo de Docker en el curso de contenedores. Este README contiene las dos
primeras clases: construccion de imagenes, configuracion, Compose y secretos.
Los archivos resueltos de Docker estan en la rama `develop` y se incorporan al
repositorio de los alumnos durante las clases. Ejecuta los comandos de cada
ejemplo despues de incorporar sus archivos a tu repositorio.

## Preparacion de la aplicacion

- Node.js 24 LTS: version 24.15.0 o superior dentro de la rama 24.
- pnpm 11.1.2, declarado en `package.json`.
- Docker con Docker Compose para los ejercicios de contenedores.

El proyecto utiliza NestJS 12, TypeScript 6 y TypeORM 1.
Ejecuta los comandos desde la raiz del repositorio. Los ejemplos de terminal
usan Bash, disponible en Linux, macOS y WSL.

```bash
corepack enable
pnpm install --frozen-lockfile
ENABLE_DB=false pnpm run start:dev
```

La API escucha por defecto en `http://localhost:3000`. No necesitas un archivo
`.env` para iniciar sin base de datos.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/hello` | Saludo inicial. |
| GET | `/hi` | Saludo alternativo. |
| GET | `/calculo?operacion=suma&a=5&b=3` | Calcula `suma`, `resta`, `multiplicar` o `dividir`. |

```bash
curl http://localhost:3000/hello
curl http://localhost:3000/hi
curl 'http://localhost:3000/calculo?operacion=resta&a=55&b=35'
```

Archivos de la aplicacion:

- `src/main.ts`: inicia NestJS y configura el puerto.
- `src/app.module.ts`: registra configuracion y modulos; carga usuarios si la BD esta habilitada.
- `src/app.controller.ts` y `src/app.service.ts`: saludos, entorno y endpoints de practica.
- `src/config/app.config.ts`: interpreta las variables de entorno.
- `src/modules/calculo/`: operaciones aritmeticas.

## Modulo 1 - Contenedores Docker

### Clase 1 - Imagenes, construccion y configuracion

#### Construccion de una imagen

[Dockerfile.v2](https://github.com/carlosmarind/curso-contenedores-template/blob/develop/Dockerfile.v2) usa una sola etapa:
conserva el codigo fuente y las dependencias de desarrollo. Ademas,
copia el contexto antes de instalar, por lo que cambiar el codigo invalida la
cache de instalacion.

```bash
docker build -f Dockerfile.v2 -t curso-contenedores:sin-multistage .
docker run --rm -p 3000:3000 -e ENABLE_DB=false curso-contenedores:sin-multistage
```

#### Optimizacion con multistage

El [Dockerfile](https://github.com/carlosmarind/curso-contenedores-template/blob/develop/Dockerfile) utiliza tres etapas: compilacion, instalacion de
dependencias de produccion y ejecucion. La imagen final contiene la aplicacion
compilada y las dependencias necesarias; ejecuta `node dist/main.js` con el
usuario `node`.

[.dockerignore](https://github.com/carlosmarind/curso-contenedores-template/blob/develop/.dockerignore) excluye del contexto, entre otros archivos,
`node_modules`, `dist`, `.git`, `.env*` y la cobertura de pruebas. La configuracion
del entorno se entrega al ejecutar el contenedor.

```bash
docker build -t curso-contenedores:local .
docker run --rm -p 3000:3000 -e ENABLE_DB=false curso-contenedores:local
```

Los Dockerfiles usan `node:24.21.0-bookworm-slim`.

#### Configuraciones y variables de ambiente

Ambas imagenes usan el usuario `node` y escuchan en el puerto 3000 por defecto.
No ejecutes ambos ejemplos a la vez publicando el mismo puerto del equipo.
Para pasar variables de NestJS a `docker run`, usa `-e VARIABLE=valor` o
`--env-file archivo`; `.dockerignore` excluye `.env*` de la imagen.

Para configurar la ejecucion local, crea `.env` en la raiz; no viene incluido ni
debe subirse a Git:

```dotenv
PORT=3000
AMBIENTE=local
ENABLE_DB=false
```

NestJS lee ese archivo al arrancar. Las variables ya definidas en el entorno del
proceso tienen prioridad sobre `.env`. Con el ejemplo anterior, inicia la API con:

```bash
pnpm run start:dev
```

Para deshabilitar la BD aunque `.env` contenga `ENABLE_DB=true`:

```bash
ENABLE_DB=false pnpm run start:dev
```

| Variable | Valor si no se define | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP de NestJS. |
| `AMBIENTE` | Sin valor por defecto | Texto que devuelve `/environment`. |
| `ENABLE_DB` | Deshabilitado | Solo el valor exacto `true` carga el modulo de usuarios y PostgreSQL. |

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/environment` | Muestra el valor de `AMBIENTE`. |

`AMBIENTE` solo cambia el texto de `/environment`; si no se define, ese texto
incluye `undefined`. No dejes `PORT` vacio: usa un puerto entero valido.

### Clase 2 - Multicontenedores, redes, volumenes y secretos

#### Docker Compose con PostgreSQL

El [docker-compose.yaml](https://github.com/carlosmarind/curso-contenedores-template/blob/develop/docker-compose.yaml) de la raiz crea PostgreSQL 18,
construye la API, publica el puerto 3000 y conecta ambos servicios mediante
`app-network`. PostgreSQL conserva sus datos en el volumen `db_data`.

Para Compose, usa este contenido en `.env` de la raiz. Es un ejemplo distinto
al de ejecucion local de NestJS:

```dotenv
POSTGRES_USER=pguser-app
POSTGRES_PASSWORD=clave-local-de-ejemplo
POSTGRES_DB=cursodb
ENABLE_DB=true
```

Compose sustituye las variables declaradas en el YAML con el entorno del shell
o `.env`; si existen en ambos, prevalece el shell. Leer `.env` no entrega todo su
contenido al contenedor: este archivo no declara `env_file`. Consulta la
[documentacion de interpolacion de Compose](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).

Compose usa `POSTGRES_*` para inicializar PostgreSQL y asigna esos mismos valores
a `DB_USERNAME`, `DB_PASSWORD` y `DB_NAME` de la API. Dentro de la red, la API
conecta a `db-app:5432`. Si omites `ENABLE_DB`, Compose lo establece en `false`;
aun asi crea PostgreSQL y espera a que este healthy antes de iniciar la API.
`POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` deben tener valores para
este ejercicio, incluso si deshabilitas el modulo de usuarios de la API.

El Compose actual no entrega `AMBIENTE` ni `PORT` al backend: agregar esas claves
a `.env` no cambia su entorno. Publica siempre `3000:3000`; el puerto 5432 de
PostgreSQL no se publica en el equipo. Por tanto, este ejemplo
no expone la BD en `localhost:5432` para ejecutar NestJS directamente en el equipo.
`APP_VERSION` se entrega con `1.0.0` por defecto, pero el codigo actual no la lee
ni la expone; no cambia `package.json` ni la etiqueta de la imagen.

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

`down` conserva los datos. `docker compose down -v` tambien elimina el volumen
y sus datos. Cambiar `POSTGRES_*` no modifica los usuarios ni la base de datos
de un volumen ya inicializado.

#### Variables de conexion de la aplicacion

La clase 1 presenta las variables generales de NestJS. Cuando `ENABLE_DB=true`,
la aplicacion tambien utiliza las siguientes variables de conexion:

| Variable | Valor si no se define | Uso |
| --- | --- | --- |
| `DB_HOST` | `localhost` | Host de PostgreSQL. |
| `DB_PORT` | `5432` | Puerto de PostgreSQL. |
| `DB_USERNAME` | `postgres` | Usuario de la base de datos. |
| `DB_PASSWORD` | `password` | Contrasena de la base de datos. |
| `DB_NAME` | `nestjs_db` | Nombre de la base de datos. |

Los valores por defecto de la base de datos son ejemplos locales. Usa las
credenciales de tu entorno y conserva los archivos `.env` fuera del repositorio.
No dejes `DB_PORT` vacio: usa un puerto entero valido.

#### Ejecucion local con PostgreSQL

Para ejecutar NestJS directamente en el equipo, necesitas una instancia de
PostgreSQL accesible y una base de datos y un usuario ya creados. Configura `.env`
con los valores de esa instancia, por ejemplo:

```dotenv
PORT=3000
AMBIENTE=local
ENABLE_DB=true
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pguser-app
DB_PASSWORD=clave-local-de-ejemplo
DB_NAME=cursodb
```

Inicia o reinicia la API con `pnpm run start:dev` despues de cambiar el archivo.
NestJS usa `DB_*`; no interpreta `POSTGRES_*`. TypeORM tiene `synchronize: true`:
crea o ajusta las tablas automaticamente al arrancar, pero no crea la base de
datos ni el usuario. Esta configuracion corresponde al laboratorio.

#### Usuarios y persistencia

`src/modules/users-data/` contiene la conexion a PostgreSQL, la entidad y el CRUD.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| POST | `/users` | Crea un usuario con `nombre` y `edad`. |
| GET | `/users?page=1&limit=10` | Lista usuarios con paginacion. |
| GET | `/users/:id` | Consulta un usuario. |
| PATCH | `/users/:id` | Actualiza un usuario. |
| DELETE | `/users/:id` | Elimina un usuario. |

Las rutas `/users` solo existen cuando `ENABLE_DB=true`. La pagina comienza en 1;
`limit` acepta de 1 a 100 usuarios y usa 10 por defecto. Los cuerpos de creacion y
actualizacion se validan: las propiedades desconocidas, las edades fuera de 0 a
150 y los identificadores que no sean enteros positivos se rechazan con HTTP 400.

Con PostgreSQL habilitado, puedes crear y listar usuarios:

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","edad":25}'
curl 'http://localhost:3000/users?page=1&limit=10'
```

#### Gestion de secretos con WordPress y MySQL

El archivo [docker-compose/docker-compose.yaml](https://github.com/carlosmarind/curso-contenedores-template/blob/develop/docker-compose/docker-compose.yaml)
es un ejercicio separado de WordPress y MySQL con archivos de secretos propios;
no corresponde a la API NestJS. Desde la raiz puedes validarlo e iniciarlo con:

```bash
docker compose -f docker-compose/docker-compose.yaml config --quiet
docker compose -f docker-compose/docker-compose.yaml up -d
```

WordPress se publica en `http://localhost:8080`. Los archivos de
`docker-compose/secrets/` contienen claves de ejemplo: MySQL usa
`mysql_root_password` para `root`, y tanto MySQL como WordPress usan
`wordpress_db_password` para `user_wordpress`. El healthcheck usa `mysqladmin ping`:
comprueba que el servidor responde, sin garantizar que la autenticacion o las
consultas de WordPress funcionen.
