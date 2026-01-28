FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

# Expose backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
