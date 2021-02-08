# set this ARG globally across builds
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
FROM base as builder-node_modules

# need TS dependencies for build
ENV NODE_ENV=development
RUN npm ci

# use devDependencies from previous stage to build production version
FROM base as builder-nextjs

# set ARG here as build will fail without TS dependencies
ARG NODE_ENV

COPY --from=builder-node_modules /srv/app/node_modules ./node_modules

RUN npm run build

# release stage uses app with only "dependencies" installed if NODE_ENV=production
FROM base as release

ARG NODE_ENV
ARG BUILD_DIR

ENV NODE_ENV=$NODE_ENV

COPY --from=builder-nextjs $BUILD_DIR/.next ./.next

# install node modules again (dependent on NODE_ENV)
RUN npm ci

EXPOSE 3000

CMD npm run start
