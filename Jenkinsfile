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
        stage("CI - revision de linter"){
            steps{
                sh 'pnpm lint'
            }
        }
        stage("Tercer paso del pipeline"){
            steps{
                 sh 'pnpm test'
            }
        }
    }
}