pipeline {
    //agent any
    agent {
        kubernetes {
            defaultContainer 'herramientas'
            yamlFile 'agent-node.yaml'
        }
    }
    stages{
        stage("Primer paso del pipeline"){
            steps{
                sh 'echo "saludos desde el terminal"'
                sh 'uname -a'
                sh 'cat /proc/version'
            }
        }
        stage("Segundo paso del pipeline"){
            steps{
                container("node-tool"){
                    sh 'node --version'
                    sh 'npm --version'
                }
            }
        }
        stage("Tercer paso del pipeline"){
            steps{
                container('kubectl-tool'){
                    sh 'kubectl version --client'
                }
            }
        }
    }
}