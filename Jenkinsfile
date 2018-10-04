#!/usr/bin/env groovy

@Library('kanolib') _

pipeline {
    agent {
        label 'ubuntu_18.04'
    }
    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results.xml'
            step([$class: 'CheckStylePublisher', pattern: 'eslint.xml'])
        }
        regression {
            notify_culprits currentBuild.result
        }
    }
    stages {
        stage('checkout') {
            steps {
                checkout scm
            }
        }
        stage('tools') {
            steps {
                script {
                    def NODE_PATH = tool 'Node 8.11.2'
                    env.PATH = "${env.PATH}:${NODE_PATH}/bin"
                    def YARN_PATH = tool 'yarn'
                    env.PATH = "${env.PATH}:${YARN_PATH}/bin"
                }
            }
        }
        stage('install dependencies') {
            steps {
                script {
                    sh "yarn"
                }
            }
        }
        stage('checkstyle') {
            steps {
                script {
                    sh "yarn checkstyle-ci"
                }
            }
        }
        stage('test') {
            steps {
                script {
                    sh "sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget"
                    sh "yarn test-ci"
                }
            }
        }
    }
}
