FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN printf 'GOOGLE_CLIENT_ID=build\nGOOGLE_CLIENT_SECRET=build\nAUTH_SECRET=build\nMONGO_URI=mongodb://localhost:27017/rezepte\nANTHROPIC_API_KEY=build\nBRING_EMAIL=build\nBRING_PASSWORD=build\n' > .env
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1
CMD ["node", "build"]
