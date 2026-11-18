# 1. Etapa de Construcción (Build) - Usamos Node 20
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código fuente
COPY . .

# Compilar la aplicación para producción
RUN npm run build

# 2. Etapa de Servidor (Nginx)
FROM nginx:alpine

# Copiar los archivos compilados a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]