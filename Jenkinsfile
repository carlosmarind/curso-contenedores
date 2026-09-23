pipeline {
    //agent any
    agent {
        kubernetes {
            defaultContainer 'node-tool'
            yamlFile 'agent-node.yaml'
        }
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
                 sh 'pnpm test'
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
                        buildctl-daemonless.sh build \
                        --frontend dockerfile.v0 \
                        --local context=. \
                        --local dockerfile=. \
                        --output type=image,\\\"name=carlosmarind/curso-contenedores:latest,carlosmarind/curso-contenedores:${env.BUILD_NUMBER}\\\",push=true
                    '''
                }
            }
        }
    }
}