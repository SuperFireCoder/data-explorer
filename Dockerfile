FROM node:12

ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV

WORKDIR /srv/app

COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD npm run start
