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
    }
}