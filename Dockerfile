FROM python:3
ENV PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y libgdal-dev nodejs npm && rm -fr /var/lib/apt/lists/*
RUN mkdir /code
WORKDIR /code
COPY . /code/
RUN npm i -g npm@latest && npm cache verify && npm ci && npm run build

ENTRYPOINT /code/docker/start.sh
