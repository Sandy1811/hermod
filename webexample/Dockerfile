FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production
RUN npm i -g nodemon
# Bundle app source
COPY ./src /usr/src/app/src
COPY ./public /usr/src/app/public

VOLUME /usr/src/app

EXPOSE 3000
CMD [ "nodemon",  "start" ]
