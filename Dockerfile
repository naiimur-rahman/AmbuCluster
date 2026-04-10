FROM node:20-alpine

# Install build dependencies for native modules if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for tsx and vite)
RUN npm install

# Copy application source
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the application
# We use npm start which runs: tsx server.ts
CMD ["npm", "start"]
