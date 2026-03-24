FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
