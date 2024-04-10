# Use the Node.js version that matches your development environment
FROM node:21

WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application if necessary
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
