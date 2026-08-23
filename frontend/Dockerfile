FROM node:20-alpine AS builder
WORKDIR /app

ENV EXPO_NO_TELEMETRY=1
ENV CI=1

ARG EXPO_PUBLIC_API_URL=https://app.liiro.io/aiopscamp-liiro-api/api/v1
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

ARG EXPO_PUBLIC_ENV=production
ENV EXPO_PUBLIC_ENV=${EXPO_PUBLIC_ENV}

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npx expo export --platform web --output-dir dist

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
