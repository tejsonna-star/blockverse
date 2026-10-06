FROM node:20-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY shared ./shared
COPY server ./server
RUN npm install --workspace=server --workspace=shared
RUN npm run build --workspace=server

FROM node:20-slim
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/shared ./shared
COPY --from=build /repo/server/node_modules ./server/node_modules
COPY --from=build /repo/server/dist ./server/dist
COPY --from=build /repo/server/package.json ./server/package.json

ENV NODE_ENV=production
EXPOSE 2567
CMD ["node", "server/dist/index.js"]
