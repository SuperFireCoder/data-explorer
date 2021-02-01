# set this ARG globally across builds
ARG NODE_ENV=development

# build with "devDependencies" (needed for TS)
FROM node:12 as builder

WORKDIR /srv/app

COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/
RUN npm ci

COPY . .

# set ENV here as build will fail without TS dependencies
ENV NODE_ENV=$NODE_ENV

RUN npm run build

# second stage uses app with only "dependencies" installed
FROM node:12

ENV NODE_ENV=$NODE_ENV

WORKDIR /srv/app

COPY --from=builder /srv/app/.next ./.next
COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/
RUN npm ci

EXPOSE 3000

CMD npm run start
