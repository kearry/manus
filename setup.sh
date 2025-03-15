#!/bin/bash
# Setup script for Manus AI system

# Stop on error
set -e

# Print steps
set -x

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting."; exit 1; }

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
  
  # Generate NextAuth secret
  SECRET=$(openssl rand -base64 32)
  sed -i "s/your-nextauth-secret/$SECRET/" .env
  
  echo "Please edit the .env file to add your API keys and configuration."
  echo "You'll need to add your Google OAuth credentials and OpenAI API key."
  echo
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup database
echo "Setting up database..."
npx prisma generate
npx prisma migrate dev --name init

# Build the application
echo "Building the application..."
npm run build

# Setup development environment
echo "Setting up development environment..."
mkdir -p .sandbox/files
mkdir -p .sandbox/code

echo "Setup complete!"
echo
echo "To start the development server, run: npm run dev"
echo "To start the Docker containers, run: docker-compose -f docker/docker-compose.yml up -d"
echo
echo "The application will be available at http://localhost:3000"