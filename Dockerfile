# set these ARG globally across builds
ARG NODE_ENV=development
ARG BUILD_DIR=/srv/app

# base image with common settings
FROM node:12 as base

ARG NPM_AUTHTOKEN
ARG BUILD_DIR

WORKDIR $BUILD_DIR

COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/
RUN npm config set '//gitlab.com/api/v4/packages/npm/:_authToken' $NPM_AUTHTOKEN

RUN npm ci

COPY . .

EXPOSE 3000

CMD npm run start

# build builder-* stages with "devDependencies" (needed for TS)
FROM base as builder

RUN npm run build

# release stage uses app with only "dependencies" installed if NODE_ENV=production
FROM builder as release

ARG NODE_ENV
ARG BUILD_DIR

COPY --from=builder $BUILD_DIR/.next ./.next

# set ARG here as build will fail without TS dependencies if NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# only use dependencies required by NODE_ENV
RUN npm ci

RUN chown -R node:node ./ 
USER node
