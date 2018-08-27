#!/usr/bin/env groovy

pipeline {
    agent any
    tools {
        nodejs 'Node 8.11.2'
    }
    stages {
        stage('install deps') {
            steps {
                script {
                    sh "yarn"
                    sh "cd test/tool && yarn"
                }
            }
        }
        stage('run tests') {
            steps {
                script {
                    sh "yarn test-jenkins"
                    junit 'test-results.xml'
                }
            }
        }
    }
}
