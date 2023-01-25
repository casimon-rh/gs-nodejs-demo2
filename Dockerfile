FROM node:16
WORKDIR /app
COPY package* .
RUN npm i
COPY . .
RUN npm run build
CMD npm start