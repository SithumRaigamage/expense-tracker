# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set metadata
LABEL maintainer="Sithum Raigamage"
LABEL description="Build stage for Expensive Tracker Frontend"

WORKDIR /app

# Copy dependency files only to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies using npm install for deterministic builds
RUN npm install --force

# Copy the rest of the application source code
COPY . .

# Build the application (using default build command for requested simplicity)
RUN npm run build

# Stage 2: Production Stage
FROM nginx:stable-alpine

# Set metadata
LABEL description="Production stage for Expensive Tracker Frontend"

# Copy the build output from the build stage to the nginx html directory
# Note: Angular 17+ outputs to dist/<project-name>/browser
COPY --from=build /app/dist/expensive-tracker-frontend/browser /usr/share/nginx/html

# Copy the nginx config as a TEMPLATE. The nginx image runs envsubst over
# /etc/nginx/templates/*.template at startup and writes the result into
# conf.d/, which is how ${BACKEND_ORIGIN} gets resolved per environment.
# NGINX_ENVSUBST_FILTER (set in docker-compose.yml) limits substitution to
# BACKEND_* so nginx's own $uri/$host variables are left alone.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Sensible default for `docker run` without compose; override in deployment.
ENV BACKEND_ORIGIN=http://expense-tracker-backend:3001
ENV NGINX_ENVSUBST_FILTER=BACKEND_

# Expose port 80
EXPOSE 80

# Healthcheck to ensure the container is running correctly
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://127.0.0.1:80/index.html || exit 1

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
