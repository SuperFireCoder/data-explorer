# set these ARG globally across builds
ARG NODE_ENV=development
ARG BUILD_DIR=/srv/app

# base image with common settings
FROM node:12 as base

ARG BUILD_DIR

WORKDIR $BUILD_DIR

COPY package*.json ./
COPY . .

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/

# build builder-* stages with "devDependencies" (needed for TS)
FROM base as builder

# need TS dependencies for build
RUN npm ci

RUN npm run build

# set ARG here as build will fail without TS dependencies if NODE_ENV=production
ARG NODE_ENV
RUN npm ci

# release stage uses app with only "dependencies" installed if NODE_ENV=production
FROM base as release

ARG NODE_ENV
ARG BUILD_DIR

ENV NODE_ENV=$NODE_ENV

COPY --from=builder $BUILD_DIR/.next ./.next
COPY --from=builder $BUILD_DIR/node_modules ./node_modules

EXPOSE 3000

RUN chown -R node:node ./ 
USER node

CMD npm run start
