# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy dependency files only
COPY package.json package-lock.json ./

# Install dependencies with clean install
RUN npm ci

# Copy source files
COPY . .

# Build for production
RUN npm run build -- --configuration production

# Production stage
FROM nginx:alpine

# Copy the build output from the build stage (from the browser subdirectory)
COPY --from=build /app/dist/expensive-tracker-frontend/browser /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
