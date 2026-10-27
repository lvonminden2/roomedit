FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY build.mjs server.mjs railway-server.mjs ./
COPY dist ./dist
RUN npm run build
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "railway-server.mjs"]
