FROM registry.access.redhat.com/ubi9/nodejs-18
# WORKDIR /app
COPY --chown=default:root package* .
RUN npm i
COPY --chown=default:root . .
RUN npm run build
CMD npm start