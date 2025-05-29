# Use official Node.js image to build the app
FROM node:20 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the app
RUN npm run build

# Use Nginx to serve the built app
FROM nginx:stable-alpine AS production

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
