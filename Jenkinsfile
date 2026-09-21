pipeline {
    
    agent any
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
    }
}