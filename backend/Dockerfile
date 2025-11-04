FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install dependencies (include dev deps for local development)
COPY package*.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 30000 && \
    npm config set fetch-timeout 60000 && \
    npm install --legacy-peer-deps

# Copy app source
COPY . .

# Expose port used by the app
EXPOSE 5000

# Default to development command; docker-compose can override this if needed
CMD ["npm", "run", "dev"]
