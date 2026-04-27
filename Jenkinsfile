pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        GIT_CREDS  = 'github-token-emailapp'
        GIT_REPO   = 'https://github.com/Samratstackly/stackly-email-main.git'
        GIT_BRANCH = 'main'

        SSH_KEY     = 'key-pair'
        DEPLOY_USER = 'ubuntu'
        DEPLOY_HOST = '3.0.181.112'
        APP_DIR     = '/home/ubuntu/stackly-email'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: "${GIT_BRANCH}",
                    credentialsId: "${GIT_CREDS}",
                    url: "${GIT_REPO}"
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                echo "🔍 Checking required tools"

                node -v
                npm -v

                if ! command -v rsync > /dev/null; then
                    echo "❌ rsync not installed on Jenkins machine"
                    exit 1
                fi
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                if [ -d frontend ]; then
                    echo "📦 Building frontend"
                    cd frontend
                    npm install
                    npm run build
                else
                    echo "⚠️ No frontend folder found, skipping"
                fi
                '''
            }
        }

        stage('Deploy Code') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    echo "🚀 Deploying to server"

                    rsync -avz --delete \
                      --exclude='.git' \
                      --exclude='node_modules' \
                      --exclude='.env' \
                      frontend \
                      django_backend \
                      email_project \
                      fastapi_app \
                      manage.py \
                      requirements.txt \
                      ${DEPLOY_USER}@${DEPLOY_HOST}:${APP_DIR}
                    """
                }
            }
        }

        stage('Remote Setup & Migrate') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        set -e

                        echo "📁 Entering app directory"
                        cd ${APP_DIR}

                        echo "🐍 Preparing Python environment"
                        if [ ! -d venv ]; then
                            python3 -m venv venv
                        fi

                        source venv/bin/activate

                        pip install --upgrade pip
                        pip install -r requirements.txt

                        echo "🧠 Running migrations"
                        python manage.py migrate --noinput

                        echo "📦 Collecting static files"
                        python manage.py collectstatic --noinput || true
                    '
                    """
                }
            }
        }

        stage('Restart Services') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        echo "🔄 Restarting services"

                        sudo systemctl restart fastapi || echo "⚠️ fastapi service not found"
                        sudo systemctl restart nginx || echo "⚠️ nginx service not found"
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ stackly-email deployed successfully'
        }
        failure {
            echo '❌ Deployment failed – check logs'
        }
    }
}
