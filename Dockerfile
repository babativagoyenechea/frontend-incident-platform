FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias completas del Frontend
RUN npm install

# Copiar el resto del código de React + Vite
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

# Arrancar el servidor de desarrollo de Vite escuchando en todas las IPs para Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
