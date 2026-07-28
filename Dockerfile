FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm i -g pm2
RUN npm i -g @nestjs/cli
RUN npm i
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
RUN npm run build
RUN npm uninstall typescript
<<<<<<< Updated upstream
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 3006
ENTRYPOINT ["/app/docker-entrypoint.sh"]
=======

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3006

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["pm2-runtime", "ecosystem.config.js"]
>>>>>>> Stashed changes
