FROM node:20-alpine AS base

# Install Python 3, FFmpeg, and espeak-ng dependencies for Kokoro TTS & audio transcoding
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    espeak-ng \
    build-base \
    python3-dev

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Install Python audio pipeline dependencies
RUN pip3 install --no-cache-dir --break-system-packages \
    kokoro-onnx \
    soundfile \
    numpy \
    scipy \
    onnxruntime \
    requests \
    pymongo

COPY . .

EXPOSE 5012

ENV NODE_ENV=production

CMD ["node", "server.js"]
