FROM node:22-alpine

WORKDIR /app

# Install dependencies (dev included) for local development
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 30000 && \
    npm config set fetch-timeout 60000 && \
    npm install --legacy-peer-deps

# Copy source
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Development server
CMD ["npm", "run", "dev"]
