FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    git

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]