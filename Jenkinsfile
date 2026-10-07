// ==============================================================================
// Pipeline principal: integracion continua (CI) y entrega/despliegue (CD)
// ==============================================================================
// CI: instala dependencias, ejecuta lint y pruebas, y compila NestJS.
// CD: construye y publica imagenes en Docker Hub y GHCR; main y test despliegan.
// Las etapas se ejecutan en orden. Un sh que termina con codigo distinto de cero
// falla el paso y normalmente impide continuar con las etapas siguientes.
//
// Requisitos de Jenkins: Declarative Pipeline, Kubernetes plugin para el agente
// y Kubernetes CLI plugin para withKubeConfig. El checkout debe incluir
// agent-node.yaml, Dockerfile y los archivos de dependencias de la aplicacion.
// regcred-dh y regcred-gh son Secrets del namespace del agente, montados en
// BuildKit; kubernetes-config es una credencial de Jenkins para el despliegue.
// Son mecanismos distintos: publicar una imagen no concede permisos en Kubernetes.
//
// Documentacion: https://www.jenkins.io/doc/book/pipeline/syntax/
// Plugins: https://plugins.jenkins.io/kubernetes/
//          https://plugins.jenkins.io/kubernetes-cli/

// Bloque raiz de un pipeline declarativo.
pipeline {
    // Alternativa comentada: agent any usaria cualquier agente disponible.
    // Este ejemplo elige un agente Kubernetes con herramientas especificas.
    //agent any
    // Define donde se ejecutan los pasos, salvo que una etapa lo cambie.
    agent {
        // El plugin Kubernetes crea un Pod temporal para ejecutar el pipeline.
        kubernetes {
            // Los sh sin container(...) se ejecutan en node-tool.
            defaultContainer 'node-tool'
            // Lee la plantilla del Pod desde el archivo versionado del repositorio.
            yamlFile 'agent-node.yaml'
        }
    }
    // Variables de entorno disponibles para todas las etapas y sus comandos shell.
    environment{
        // Repositorio de destino en Docker Hub, sin etiqueta.
        DH_REPO = 'carlosmarind/curso-contenedores'
        // Repositorio de destino en GitHub Container Registry, sin etiqueta.
        GH_REPO = 'ghcr.io/carlosmarind/curso-contenedores'
        // Namespace de la aplicacion que se actualizara durante el despliegue.
        K8S_NAMESPACE = 'curso-contenedores'
    }
    // Lista ordenada de etapas; cada stage aparece separada en la interfaz de Jenkins.
    stages{
        // ==============================================================================
        // CI: activar el gestor de paquetes
        // ==============================================================================
        stage("CI - Activacion de pnpm"){
            // Pasos de esta etapa; sh ejecuta comandos en el contenedor seleccionado.
            steps{
                // Corepack habilita los ejecutables del gestor declarado en packageManager
                // de package.json; el proyecto fija pnpm@11.1.2.
                sh 'corepack enable'
                // Muestra la version de Node del agente, no la version de la imagen final de la API.
                sh 'node --version'
                // Permite comprobar en el log que se esta usando el pnpm esperado.
                sh 'pnpm --version'
            }
        }
        // ==============================================================================
        // CI: instalar exactamente las dependencias del lockfile
        // ==============================================================================
        stage("CI - Instalacion de dependencias"){
            steps{
                // No actualiza pnpm-lock.yaml; falla si no coincide con package.json.
                // Instala tambien dependencias de desarrollo necesarias para lint, Jest y build.
                sh 'pnpm install --frozen-lockfile'
            }
        }
        // ==============================================================================
        // CI: comprobar estilo y reglas de codigo
        // ==============================================================================
        stage("CI - Revision de Linter"){
            steps{
                // Ejecuta scripts.lint de package.json. No usa --fix: informa y falla,
                // pero no modifica el codigo para ocultar problemas durante la validacion.
                sh 'pnpm lint'
            }
        }
        // ==============================================================================
        // CI: ejecutar las pruebas automatizadas
        // ==============================================================================
        stage("CI - Ejecucion de Test"){
            steps{
                 // Ejecuta Jest mediante scripts.test, que habilita los modulos VM para NestJS 12.
                 // --runInBand usa un solo proceso para reducir memoria en el agente Node.
                 sh 'pnpm test --runInBand'
            }
        }
        // ==============================================================================
        // CI: compilar la aplicacion
        // ==============================================================================
        stage("CI - Construccion de aplicacion"){
            steps{
                 // Ejecuta nest build y genera dist/. Comprueba la compilacion antes de publicar.
                 sh 'pnpm build'
            }
        }
        // ==============================================================================
        // CD: construir y publicar en dos registros
        // ==============================================================================
        // Esta etapa no tiene when: se ejecuta en todas las ramas que superan la CI.
        stage("CD - Construccion imagen y upload"){
            steps{
                // Cambia de node-tool a buildkit sin abandonar el Pod ni su workspace.
                container('buildkit'){
                    // Bloque shell de varias lineas. Las comillas simples triples evitan que Groovy
                    // interpole las variables; ${...} se expande despues en el shell.
                    sh '''
                        # Selecciona la CARPETA que contiene config.json con autenticacion para Docker Hub.
                        export DOCKER_CONFIG=/docker-config/dockerhub
                        # Falla si el archivo no existe o esta vacio, sin imprimir las credenciales.
                        test -s ${DOCKER_CONFIG}/config.json

                        # buildctl-daemonless.sh inicia BuildKit para esta construccion, sin usar el
                        # daemon Docker del host. Las barras finales continuan el comando en otra linea.
                        # --frontend dockerfile.v0 interpreta las instrucciones del Dockerfile.
                        # --local context=. envia el directorio actual como contexto de construccion.
                        # --local dockerfile=. indica donde encontrar el Dockerfile.
                        # --output type=image exporta una imagen; name contiene dos etiquetas del mismo
                        # repositorio. latest es mutable y BUILD_NUMBER identifica esta ejecucion Jenkins.
                        # push=true publica las etiquetas en el registro en lugar de solo construir.
                        # Las comillas escapadas mantienen unida la lista name con comas.
                        buildctl-daemonless.sh build \
                        --frontend dockerfile.v0 \
                        --local context=. \
                        --local dockerfile=. \
                        --output type=image,\\\"name=${DH_REPO}:latest,${DH_REPO}:${BUILD_NUMBER}\\\",push=true

                        # Cambia la carpeta de autenticacion para la segunda publicacion, esta vez en GHCR.
                        export DOCKER_CONFIG=/docker-config/github
                        # Comprueba tambien que la configuracion de GHCR exista y tenga contenido.
                        test -s ${DOCKER_CONFIG}/config.json

                        # Segunda llamada a BuildKit: construye y publica las dos etiquetas de GHCR.
                        # El archivo actual realiza dos construcciones; no es una copia entre registros.
                        buildctl-daemonless.sh build \
                        --frontend dockerfile.v0 \
                        --local context=. \
                        --local dockerfile=. \
                        --output type=image,\\\"name=${GH_REPO}:latest,${GH_REPO}:${BUILD_NUMBER}\\\",push=true
                    '''
                }
            }
        }
        // ==============================================================================
        // CD: actualizar el Deployment existente en Kubernetes
        // ==============================================================================
        stage('CD - Despliegue continuo'){
            // Condicion para ejecutar SOLO esta etapa; no restringe la publicacion anterior.
            when {
                // Basta con que una de las condiciones de rama se cumpla.
                anyOf {
                    // Permite desplegar desde main. branch se evalua en un job Multibranch Pipeline.
                    branch 'main'
                    // Tambien permite desplegar desde test.
                    branch 'test'
                }
            }
            steps{
                // Ejecuta kubectl en la imagen que contiene las herramientas de Kubernetes.
                container('kubectl-tool'){
                    // El plugin crea temporalmente un kubeconfig usando la credencial de Jenkins
                    // kubernetes-config. La identidad debe tener permisos RBAC en el namespace;
                    // este paso no crea por si solo el namespace, el Deployment ni los Secrets.
                    withKubeConfig([credentialsId: 'kubernetes-config']){
                        // El shell expande K8S_NAMESPACE, GH_REPO y BUILD_NUMBER definidos por Jenkins.
                        sh '''
                           # Actualiza la imagen del contenedor curso-contenedores dentro del Deployment
                           # curso-contenedores. Usa la etiqueta numerada que se acaba de publicar; el
                           # Deployment inicia una actualizacion de Pods al cambiar su plantilla.
                           kubectl -n ${K8S_NAMESPACE} set image deployment/curso-contenedores curso-contenedores=${GH_REPO}:${BUILD_NUMBER}
                           # Espera e informa el resultado del rollout. Los probes de readiness ayudan
                           # a determinar cuando los Pods nuevos estan listos para atender trafico.
                           kubectl -n ${K8S_NAMESPACE} rollout status deployment/curso-contenedores
                        '''
                    }
                }
            }
        }
    }
}
