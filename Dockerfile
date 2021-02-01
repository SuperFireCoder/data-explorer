# set this ARG globally across builds
ARG NODE_ENV=development

# base image with common settings
FROM node:12 as base

WORKDIR /srv/app

COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/

# build builder stage with "devDependencies" (needed for TS)
FROM base as builder

RUN npm ci

COPY . .

# set ENV here as build will fail without TS dependencies
ENV NODE_ENV=$NODE_ENV

RUN npm run build

# release stage uses app with only "dependencies" installed if NODE_ENV=production
FROM base as release

ENV NODE_ENV=$NODE_ENV

WORKDIR /srv/app

COPY --from=builder /srv/app/.next ./.next

# install node modules again (dependent on NODE_ENV)
RUN npm ci

EXPOSE 3000

CMD npm run start
