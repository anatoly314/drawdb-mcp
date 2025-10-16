pipeline {
    agent {
        label 'kaniko'
    }

    environment {
        HARBOR_REGISTRY = 'harbor.anatoly.dev'
        HARBOR_PROJECT = 'drawdb'
        IMAGE_NAME = 'drawdb'
        GIT_COMMIT_SHORT = "${env.GIT_COMMIT.take(7)}"
        BRANCH_NAME_CLEAN = "${params.BRANCH_NAME.replaceAll('origin/', '').replaceAll('/', '-')}"
    }

    stages {
        stage('Build and Push') {
            steps {
                container('kaniko') {
                    script {
                        withCredentials([usernamePassword(
                            credentialsId: 'harbor-credentials',
                            usernameVariable: 'HARBOR_USER',
                            passwordVariable: 'HARBOR_PASS'
                        )]) {
                            sh '''
                                echo '{"auths":{"'${HARBOR_REGISTRY}'":{"username":"'${HARBOR_USER}'","password":"'${HARBOR_PASS}'"}}}' > /kaniko/.docker/config.json
                                /kaniko/executor \
                                    --context . \
                                    --dockerfile ./Dockerfile \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:latest \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Successfully built and pushed image:"
            echo "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${IMAGE_NAME}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}"
        }
        failure {
            echo 'Build failed!'
        }
    }
}
