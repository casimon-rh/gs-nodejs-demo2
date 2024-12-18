FROM registry.access.redhat.com/ubi9/nodejs-18
# WORKDIR /app
COPY package* .
RUN npm i
COPY . .
RUN npm run build
CMD npm start