pipeline {
    agent {
        label 'kaniko'
    }

    environment {
        HARBOR_REGISTRY = 'harbor.anatoly.dev'
        HARBOR_PROJECT = 'drawdb'
        FRONTEND_IMAGE = 'drawdb-gui'
        BACKEND_IMAGE = 'drawdb-backend'
        GIT_COMMIT_SHORT = "${env.GIT_COMMIT.take(7)}"
        BRANCH_NAME_CLEAN = "${params.BRANCH_NAME.replaceAll('origin/', '').replaceAll('/', '-')}"
    }

    stages {
        stage('Build and Push Frontend') {
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
                                    --target frontend \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${FRONTEND_IMAGE}:latest \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${FRONTEND_IMAGE}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}
                            '''
                        }
                    }
                }
            }
        }

        stage('Build and Push Backend') {
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
                                    --target backend \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${BACKEND_IMAGE}:latest \
                                    --destination ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${BACKEND_IMAGE}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Successfully built and pushed both images:"
            echo "Frontend: ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${FRONTEND_IMAGE}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}"
            echo "Backend: ${HARBOR_REGISTRY}/${HARBOR_PROJECT}/${BACKEND_IMAGE}:${BRANCH_NAME_CLEAN}-${GIT_COMMIT_SHORT}"
        }
        failure {
            echo 'Build failed!'
        }
    }
}
