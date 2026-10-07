pipeline {
    //agent any
    agent {
        kubernetes {
            defaultContainer 'node-tool'
            yamlFile 'agent-node.yaml'
        }
    }
    environment{
        DH_REPO = 'carlosmarind/curso-contenedores'
        GH_REPO = 'ghcr.io/carlosmarind/curso-contenedores'
        K8S_NAMESPACE = 'curso-contenedores'
    }
    stages{
        stage("CI - Activacion de pnpm"){
            steps{
                sh 'corepack enable'
                sh 'node --version'
                sh 'pnpm --version'
            }
        }
        stage("CI - Instalacion de dependencias"){
            steps{
                sh 'pnpm install --frozen-lockfile'
            }
        }
        stage("CI - Revision de Linter"){
            steps{
                sh 'pnpm lint'
            }
        }
        stage("CI - Ejecucion de Test"){
            steps{
                 sh 'pnpm test --runInBand'
            }
        }
        stage("CI - Construccion de aplicacion"){
            steps{
                 sh 'pnpm build'
            }
        }
        stage("CD - Construccion imagen y upload"){
            steps{
                container('buildkit'){
                    sh '''
                        export DOCKER_CONFIG=/docker-config/dockerhub
                        test -s ${DOCKER_CONFIG}/config.json

                        buildctl-daemonless.sh build \
                        --frontend dockerfile.v0 \
                        --local context=. \
                        --local dockerfile=. \
                        --output type=image,\\\"name=${DH_REPO}:latest,${DH_REPO}:${BUILD_NUMBER}\\\",push=true

                        export DOCKER_CONFIG=/docker-config/github
                        test -s ${DOCKER_CONFIG}/config.json

                        buildctl-daemonless.sh build \
                        --frontend dockerfile.v0 \
                        --local context=. \
                        --local dockerfile=. \
                        --output type=image,\\\"name=${GH_REPO}:latest,${GH_REPO}:${BUILD_NUMBER}\\\",push=true
                    '''
                }
            }
        }
        stage('CD - Despliegue continuo'){
            when {
                anyOf {
                    branch 'main'
                    branch 'test'
                }
            }
            steps{
                container('kubectl-tool'){
                    withKubeConfig([credentialsId: 'kubernetes-config']){
                        sh '''
                           kubectl -n ${K8S_NAMESPACE} set image deployment/curso-contenedores curso-contenedores=${GH_REPO}:${BUILD_NUMBER}
                           kubectl -n ${K8S_NAMESPACE} rollout status deployment/curso-contenedores
                        '''
                    }
                }
            }
        }
    }
}
