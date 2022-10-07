# FROM node:14.18-alpine AS prod-front
# #RUN mkdir /app
# WORKDIR /app
# ENV PATH /app/node_modules/.bin:$PATH
# COPY package.json .
# #COPY patches ./patches
# RUN apk add --no-cache python3 py3-pip make g++
# RUN yarn
# COPY . .
# #RUN yarn build-local
# RUN yarn build-dev-local

FROM nginx:1.21.5-alpine
RUN mkdir -p /var/log/nginx
COPY ./nginx/default.conf /etc/nginx/nginx.conf
# COPY --from=prod-front /app/dist /usr/share/nginx/html/cms
COPY ./dist /usr/share/nginx/html/cms
CMD [ "nginx", "-g", "daemon off;" ]