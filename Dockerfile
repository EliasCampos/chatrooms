FROM node:12.16.3-alpine3.9
WORKDIR /app
RUN apk --no-cache add --virtual builds-deps build-base python
COPY package.json .
RUN npm install --quiet
