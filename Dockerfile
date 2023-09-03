FROM debian:latest

RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    git \
    make

RUN git clone https://github.com/Digitales-Kastchensystem/Server.git

WORKDIR /Server

RUN make

EXPOSE 8080

RUN bash ./build/start.sh