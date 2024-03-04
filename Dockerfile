# Establece la imagen base como node:14 desde Docker Hub
FROM node:14

# Establece el directorio de trabajo dentro del contenedor como /app
WORKDIR /app

# Copia el archivo package.json y cualquier archivo que comience con "package" desde el contexto de construcción al directorio de trabajo del contenedor
COPY package*.json ./

# Ejecuta npm install dentro del directorio de trabajo del contenedor para instalar las dependencias de la aplicación
RUN npm install

# Copia todo el contenido del contexto de construcción al directorio de trabajo del contenedor
COPY . .

# Define el comando predeterminado que se ejecutará al iniciar un contenedor basado en esta imagen
CMD ["npm", "start"]
