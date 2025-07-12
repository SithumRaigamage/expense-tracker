# Use a Node.js base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY frontend/ ./

# Build the Angular application
RUN npm run build -- --configuration production

# Use a lightweight web server like nginx to serve the static files
FROM nginx:alpine

# Copy the built Angular application from the previous stage
COPY --from=0 /app/dist/frontend/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]