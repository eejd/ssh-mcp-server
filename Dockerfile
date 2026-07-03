FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV MCP_TRANSPORT=http MCP_PORT=8080
EXPOSE 8080
ENTRYPOINT ["node", "build/index.js"]
