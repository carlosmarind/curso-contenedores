# Curso de Contenedores - API NestJS

Proyecto del curso para practicar una API con NestJS y TypeScript, construir
imagenes Docker, ejecutar servicios con Docker Compose y desplegar en Kubernetes
mediante Jenkins. Incluye PostgreSQL, probes, RBAC, cuotas y escalado automatico.

## Requisitos

- Node.js 24 LTS: version 24.15.0 o superior dentro de la rama 24.
- pnpm 11.1.2, declarado en `package.json`.
- Docker con Docker Compose para los ejercicios de contenedores.
- kubectl y acceso a un cluster para los ejercicios de Kubernetes.

El proyecto utiliza NestJS 12, TypeScript 6 y TypeORM 1. El Dockerfile y los
agentes Node de Jenkins usan `node:24.21.0-bookworm-slim`.
Las pruebas usan Jest 30 y ts-jest 29; sus scripts habilitan los modulos VM de
Node para cargar los paquetes ESM de NestJS 12.

Ejecuta los comandos siguientes desde la raiz del repositorio.

## Instalacion y ejecucion local

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run start:dev
```

La API escucha por defecto en `http://localhost:3000`. NestJS carga las variables
del entorno y del archivo `.env`. Revisa ese archivo antes de iniciar: si habilita
la base de datos, necesitas PostgreSQL disponible.
Para ejecutar los ejemplos sin base de datos:

```bash
ENABLE_DB=false pnpm run start:dev
```

### Variables de la aplicacion

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP de NestJS. |
| `AMBIENTE` | Sin valor por defecto | Texto que devuelve `/environment`. |
| `ENABLE_DB` | Deshabilitado | Solo el valor exacto `true` carga el modulo de usuarios y PostgreSQL. |
| `DB_HOST` | `localhost` | Host de PostgreSQL. |
| `DB_PORT` | `5432` | Puerto de PostgreSQL. |
| `DB_USERNAME` | `postgres` | Usuario de la base de datos. |
| `DB_PASSWORD` | `password` | Contrasena de la base de datos. |
| `DB_NAME` | `nestjs_db` | Nombre de la base de datos. |

Los valores por defecto de la base de datos son ejemplos locales. Usa las
credenciales de tu entorno y conserva los archivos `.env` fuera del repositorio.

## Endpoints

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/hello` | Saludo inicial. |
| GET | `/hi` | Saludo alternativo. |
| GET | `/environment` | Muestra el valor de `AMBIENTE`. |
| GET | `/calculo?operacion=suma&a=5&b=3` | Calcula `suma`, `resta`, `multiplicar` o `dividir`. |
| GET | `/cpu` | Simula trabajo de CPU durante unos 10 segundos. |
| GET | `/memory` | Reserva aproximadamente 100 MB por conexion durante 60 segundos o hasta que el cliente cierre la conexion. |
| GET | `/health/live` | Indica que la aplicacion esta viva. |
| GET | `/health/ready` | Comprueba si esta lista; con la base de datos habilitada tambien verifica su conexion. |
| POST | `/users` | Crea un usuario con `nombre` y `edad`. |
| GET | `/users` | Lista usuarios. |
| GET | `/users/:id` | Consulta un usuario. |
| PATCH | `/users/:id` | Actualiza un usuario. |
| DELETE | `/users/:id` | Elimina un usuario. |

Las rutas `/users` solo existen cuando `ENABLE_DB=true`.
Los endpoints `/cpu` y `/memory` son ejercicios de carga: las conexiones
concurrentes aumentan el consumo de recursos.

```bash
curl http://localhost:3000/hello
curl http://localhost:3000/hi
curl 'http://localhost:3000/calculo?operacion=resta&a=55&b=35'
curl http://localhost:3000/health/ready
```

Con PostgreSQL habilitado, puedes crear y listar usuarios:

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","edad":25}'
curl http://localhost:3000/users
```

## Comandos de desarrollo

```bash
pnpm run lint
pnpm test --runInBand
pnpm run test:watch
pnpm run test:cov
pnpm run build
pnpm run start:prod
```

`start:prod` ejecuta la compilacion de `dist/`; primero ejecuta `build`.
`--runInBand` ejecuta las pruebas en un solo proceso para reducir el consumo de
memoria, como hace el pipeline principal.

## Docker

El [Dockerfile](Dockerfile) utiliza tres etapas: compilacion, instalacion de
dependencias de produccion y ejecucion. La imagen final contiene la aplicacion
compilada y las dependencias necesarias; ejecuta `node dist/main.js` con el
usuario `node`.

[.dockerignore](.dockerignore) excluye del contexto, entre otros archivos,
`node_modules`, `dist`, `.git`, `.env*` y la cobertura de pruebas. La configuracion
del entorno se entrega al ejecutar el contenedor.

```bash
docker build -t curso-contenedores:local .
docker run --rm -p 3000:3000 -e ENABLE_DB=false curso-contenedores:local
```

### Docker Compose con PostgreSQL

El [docker-compose.yaml](docker-compose.yaml) de la raiz crea PostgreSQL 18,
construye la API, publica el puerto 3000 y conecta ambos servicios mediante
`app-network`. PostgreSQL conserva sus datos en el volumen `db_data`.

Crea o ajusta un archivo `.env` con valores para tu laboratorio:

```dotenv
POSTGRES_USER=pguser-app
POSTGRES_PASSWORD=clave-local-de-ejemplo
POSTGRES_DB=cursodb
ENABLE_DB=true
```

Compose usa `POSTGRES_*` para inicializar PostgreSQL y asigna esos mismos valores
a `DB_USERNAME`, `DB_PASSWORD` y `DB_NAME` de la API. Dentro de la red, la API
conecta a `db-app:5432`. Si omites `ENABLE_DB`, Compose lo establece en `false`;
aun asi crea PostgreSQL y espera a que este healthy antes de iniciar la API.
`APP_VERSION` tambien se entrega a la API, con `1.0.0` por defecto; no cambia
la version de `package.json` ni la etiqueta de la imagen.

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

El archivo [docker-compose/docker-compose.yaml](docker-compose/docker-compose.yaml)
es un ejercicio separado de WordPress y MySQL con archivos de secretos propios;
no corresponde a la API NestJS.

## Kubernetes

| Archivo | Contenido |
| --- | --- |
| [kubernetes.yaml](kubernetes.yaml) | Namespace, ConfigMap, Secret, Deployment de la API, Service e Ingress. |
| [bbdd.yaml](bbdd.yaml) | Deployment de PostgreSQL, Service y PersistentVolumeClaim. |
| [resources.yaml](resources.yaml) | ResourceQuota y HorizontalPodAutoscaler. |
| [accounts.yaml](accounts.yaml) | ServiceAccount, token y ejemplos de permisos RBAC. |
| [agent-node.yaml](agent-node.yaml) | Plantilla del Pod de herramientas para Jenkins. |

Revisa el contexto activo, las credenciales de ejemplo y las imagenes antes de
aplicar los manifiestos en tu cluster de laboratorio. Se necesita almacenamiento
para el PVC de PostgreSQL. El Ingress requiere un controlador instalado y que
`app.local` resuelva a su direccion. El HPA requiere la API de metricas.

```bash
kubectl config current-context
kubectl apply -n curso-contenedores -f kubernetes.yaml
kubectl apply -n curso-contenedores -f bbdd.yaml
kubectl rollout status deployment/curso-contenedores-postgres -n curso-contenedores
kubectl rollout status deployment/curso-contenedores -n curso-contenedores
kubectl get deployment,pods,service,ingress -n curso-contenedores
```

`kubernetes.yaml` crea el namespace y habilita la base de datos. La API puede
reintentar o reiniciarse hasta que PostgreSQL este disponible. El parametro
`-n curso-contenedores` tambien coloca el ConfigMap y el Secret en el namespace
correcto: esos dos objetos no declaran `metadata.namespace`.

Para acceder sin configurar el Ingress:

```bash
kubectl port-forward service/curso-contenedores 3000:80 -n curso-contenedores
```

En otra terminal:

```bash
curl http://localhost:3000/health/ready
```

Como ejercicios adicionales, revisa los comentarios de `resources.yaml` y
`accounts.yaml` antes de aplicarlos: uno agrega cuotas y escalado; el otro concede
permisos, incluidos permisos globales mediante ClusterRoleBinding.

## Jenkins

| Archivo | Proposito |
| --- | --- |
| [Jenkinsfile.v1](Jenkinsfile.v1) | Primeros pasos y comparacion de agentes Kubernetes, agente con etiqueta `wsl2` y contenedor Docker. |
| [Jenkinsfile.v2](Jenkinsfile.v2) | Usa `agent-node.yaml` y muestra comandos en los contenedores de herramientas, Node y kubectl. |
| [Jenkinsfile](Jenkinsfile) | Instala dependencias, ejecuta lint y pruebas, compila, construye y publica imagenes, y despliega. |

El pipeline principal requiere Declarative Pipeline, Kubernetes plugin y
Kubernetes CLI plugin. La v1 tambien necesita Docker Pipeline y un agente con
etiqueta `wsl2` capaz de ejecutar Docker para su ejemplo de agente Docker.
Las versiones v1 y v2 son ejemplos progresivos; no publican ni despliegan la API.

El pipeline principal usa Node para CI, BuildKit rootless para construir y
publicar, y kubectl para desplegar. Publica en
`carlosmarind/curso-contenedores` de Docker Hub y en
`ghcr.io/carlosmarind/curso-contenedores`, con etiquetas `latest` y `BUILD_NUMBER`.
El despliegue solo se ejecuta para las ramas `main` y `test` en un job Multibranch:
actualiza el Deployment existente con la imagen de GHCR etiquetada con el numero
de ejecucion y espera el resultado del rollout.

Requisitos propios del entorno Jenkins:

- Secrets `regcred-dh` y `regcred-gh` en el namespace del agente, montados por
  `agent-node.yaml` para autenticar BuildKit en los registros.
- Credencial Jenkins `kubernetes-config` para acceder al cluster de despliegue.
- Deployment `curso-contenedores` ya creado en el namespace `curso-contenedores`;
  el pipeline actualiza su imagen, no aplica todos los manifiestos.

## Estructura de la aplicacion

- `src/main.ts`: inicia NestJS y configura el puerto.
- `src/app.module.ts`: registra configuracion y modulos; carga usuarios si la BD esta habilitada.
- `src/app.controller.ts` y `src/app.service.ts`: saludos, entorno, carga y healthchecks.
- `src/config/app.config.ts`: interpreta las variables de entorno.
- `src/modules/calculo/`: operaciones aritmeticas.
- `src/modules/users-data/`: conexion a PostgreSQL, entidad y CRUD de usuarios.
- `src/**/*.spec.ts`: pruebas de la aplicacion.
