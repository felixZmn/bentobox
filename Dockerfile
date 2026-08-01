FROM nginx:1.31.3-alpine-slim

LABEL org.opencontainers.image.source=https://github.com/felixzmn/bentobox

COPY ./server.conf /etc/nginx/conf.d/server.conf
COPY ./html /usr/share/nginx/html
