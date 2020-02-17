FROM node:12.16.0-alpine3.11

WORKDIR /usr/src/app

COPY . .

RUN npm install \
  && npm cache clean --force

EXPOSE 8080

CMD [ "npm", "start" ]