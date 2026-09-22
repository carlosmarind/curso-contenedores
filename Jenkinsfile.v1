pipeline {
    
    //agent any
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
    containers:
      - name: herramientas
        image: alpine:3.23
        command:
          - cat
        tty: true
      - name: node-tool
        image: node:26
        command:
          - cat
        tty: true
            '''
        }
    }
    stages{
        stage("Primer paso del pipeline"){
            steps{
                sh 'echo "saludos desde el terminal"'
            }
        }
         stage("Segundo paso del pipeline"){
            steps{
                sh 'echo "segundos saludos desde el terminal"'
            }
        }
        stage("Tercer paso del pipeline"){
            steps{
                 sh 'echo "Tercer saludo desde el terminal"'
            }
        }
        stage("Cuarto paso del pipeline"){
            agent {
                label 'wsl2'
            }
            steps{
                 sh 'docker ps'
            }
        }
        stage("Quinto paso del pipeline"){
            agent {
                docker {
                    label 'wsl2'
                    image 'node:26'
                }
            }
            steps{
                 sh 'node -v'
            }
        }
        stage("Sexto paso del pipeline"){
            steps{
                container("node-tool"){
                    sh 'node -v'
                }
            }
        }
    }
}