# Use Node.js 18 Alpine for a lightweight image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
