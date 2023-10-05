# set these ARG globally across builds
ARG BASE_IMAGE=node:19
ARG NODE_ENV=development
ARG BUILD_DIR=/srv/app

# base image with common settings
FROM $BASE_IMAGE as base

ARG NPM_AUTHTOKEN
ARG BUILD_DIR

WORKDIR $BUILD_DIR

COPY package*.json ./

RUN npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/ && \
    npm config set '//gitlab.com/api/v4/packages/npm/:_authToken' $NPM_AUTHTOKEN && \
    npm ci --omit=optional && npm i @next/swc-linux-x64-gnu

EXPOSE 3000

CMD npm run start


# build builder-* stages with "devDependencies" (needed for TS)
FROM base as builder

COPY . .

# Disable Next.js telemetry
# https://nextjs.org/telemetry
RUN npx next telemetry disable && \
    npm run build

# release stage uses app with only "dependencies" installed if NODE_ENV=production
FROM builder as release

ARG NODE_ENV
ARG BUILD_DIR
ARG BUILD_ID

COPY --chown=node:node --from=builder $BUILD_DIR/.next ./.next

# exposed to client
ENV NEXT_PUBLIC_BUILD_ID=$BUILD_ID

# set ARG here as build will fail without TS dependencies if NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# only use dependencies required by NODE_ENV
RUN npm ci --omit=dev --omit=optional

RUN chown -R node:node ./ 
USER node
