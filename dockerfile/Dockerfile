# syntax=docker/dockerfile:1.4
FROM registry.cn-hangzhou.aliyuncs.com/kube-nova/node:20-alpine AS builder

ENV TZ=Asia/Shanghai
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

RUN --mount=type=cache,target=/root/.npm,id=npm-cache \
    npm install -g pnpm@9.15.3 && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set store-dir /root/.pnpm-store

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.pnpm-store,id=pnpm-store \
    pnpm install --frozen-lockfile

COPY . .

RUN --mount=type=cache,target=/app/node_modules/.cache,id=build-cache \
    NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

FROM registry.cn-hangzhou.aliyuncs.com/kube-nova/nginx:stable-alpine

ENV TZ=Asia/Shanghai

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

RUN rm -rf /etc/nginx/conf.d/*

COPY --chown=nginx:nginx dockerfile/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx dockerfile/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chmod -R 755 /var/cache/nginx \
    && chmod -R 755 /var/log/nginx

# Expose port
EXPOSE 80

# Run as non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]