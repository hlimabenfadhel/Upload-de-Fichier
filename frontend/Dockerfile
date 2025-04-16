# Utilisation de l'image Node.js comme base
FROM node:16

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier tout le projet dans l'image Docker
COPY . .

# Construire l'application React
RUN npm run build

# Exposer le port sur lequel l'application React fonctionne
EXPOSE 3000

# Commande pour démarrer l'application React
CMD ["npm", "start"]
