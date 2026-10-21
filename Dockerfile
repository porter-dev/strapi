FROM node:24-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
RUN chown node:node /app
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    HOST=0.0.0.0 \
    PORT=1337
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
