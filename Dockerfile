FROM debian:stable
USER root
WORKDIR /usr/src/app
COPY ./sources.list /etc/apt/sources.list

RUN apt-get update && apt-get install -y libttspico-utils curl software-properties-common gnupg libpcre++-dev python3 python3-pip  nodejs wget python-pip alsa-utils libasound2-dev nano libatlas-base-dev libmagic-dev  python-pyaudio python3-pyaudio sox  libpcre3 libpcre3-dev pulseaudio wget git python-pip && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://deb.nodesource.com/setup_11.x |  bash -
RUN apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

# download deepspeech model
#COPY ./deepspeech-model ./deepspeech-model
#RUN chmod 777 deepspeech-model/install.sh
#RUN cd deepspeech-model && ./install.sh 

# copy source
COPY ./package*.json ./

# SNOWBOY build deps
RUN pip install pyaudio

RUN npm install 
RUN npm install nan
RUN npm install node-gyp node-pre-gyp

# swig
RUN wget http://downloads.sourceforge.net/swig/swig-3.0.10.tar.gz && tar xzf swig-3.0.10.tar.gz && cd swig-3.0.10 && ./configure --prefix=/usr --without-clisp --without-maximum-compile-warnings && make && make install && install -v -m755 -d /usr/share/doc/swig-3.0.10 && cp -v -R Doc/* /usr/share/doc/swig-3.0.10
# build snowboy
RUN cd /tmp; git clone https://github.com/Dabolus/snowboy.git; cd snowboy/ ; npm install && ./node_modules/node-pre-gyp/bin/node-pre-gyp clean configure build

RUN npm i /tmp/snowboy
RUN npm install -g pm2 
RUN npm install -g nodemon
COPY ./ecosystem.config.js ./
COPY ./src ./src
#COPY ./rasa ./rasa
# bake in credentials
#COPY ./hermod-1548488627033-bdeb0a01d824.json ./hermod-1548488627033-bdeb0a01d824.json

# no logs ?
#CMD ["pm2-runtime", "--no-daemon", "ecosystem.config.js"]
WORKDIR /usr/src/app/src
CMD ["nodemon", "index.js"]
