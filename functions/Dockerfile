FROM node:14

WORKDIR /functions

COPY package*.json .

WORKDIR /functions/src

# prisma file
COPY ["functions/src/db", "/functions/src/db"]

WORKDIR /functions

COPY functions/tsconfig.json .

COPY functions/* .

RUN npm install && npx prisma generate && npm run prisma

EXPOSE 3000

CMD ["node", "index.js"]
