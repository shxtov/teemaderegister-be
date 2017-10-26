# tries to find and install image
FROM node:8

# creates directory
RUN mkdir /var/app
WORKDIR /var/app

# copies json and installs npm packages in container
COPY package.json /var/app/package.json
COPY package-lock.json /var/app/package-lock.json

RUN npm install
RUN npm install pm2 -g

VOLUME /var/app
