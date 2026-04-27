pipeline {
    agent any

    tools {
        nodejs 'Node18'
    }

    environment {
        GIT_REPO   = 'https://github.com/Samratstackly/stackly-email-main.git'
        GIT_BRANCH = 'main'

        SSH_KEY     = 'Sonar'   // 🔑 MUST exist in Jenkins
        DEPLOY_USER = 'ubuntu'
        DEPLOY_HOST = '52.212.177.7'
        APP_DIR     = '/home/ubuntu/stackly-email'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git url: "${GIT_REPO}", branch: "${GIT_BRANCH}"
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                set -e
                echo "🔍 Checking tools"

                node -v
                npm -v

                if ! command -v rsync > /dev/null; then
                    echo "❌ rsync not installed"
                    exit 1
                fi
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                set -e

                if [ -d frontend ]; then
                    echo "📦 Building frontend"
                    cd frontend
                    npm install
                    npm run build
                    cd ..
                else
                    echo "⚠️ No frontend folder found"
                fi
                '''
            }
        }

        stage('Deploy Code') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    set -e
                    echo "🚀 Deploying to EC2"

                    rsync -avz --delete \
                      -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
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
                        mkdir -p ${APP_DIR}
                        cd ${APP_DIR}

                        echo "🐍 Setting up Python environment"
                        if [ ! -d venv ]; then
                            python3 -m venv venv
                        fi

                        source venv/bin/activate

                        echo "⬆️ Installing dependencies"
                        pip install --upgrade pip
                        pip install -r requirements.txt

                        echo "🧠 Running migrations"
                        python manage.py migrate --noinput

                        echo "📦 Collect static files"
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

                        sudo systemctl restart gunicorn || echo "⚠️ gunicorn not found"
                        sudo systemctl restart fastapi || echo "⚠️ fastapi not found"
                        sudo systemctl restart nginx || echo "⚠️ nginx not found"
                    '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        echo "🩺 Running health check"

                        curl -f http://localhost || {
                            echo "❌ App not responding"
                            exit 1
                        }
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful'
        }
        failure {
            echo '❌ Deployment failed – check logs'
        }
    }
}
