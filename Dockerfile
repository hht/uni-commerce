FROM node:latest

WORKDIR /uni-commerce

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD [ "run", "/bin/sh" ]