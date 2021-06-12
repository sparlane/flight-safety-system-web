#!/bin/bash

./setup.sh
cp -dpR static/* main/static/
source venv/bin/activate
./manage.py makemigrations
./manage.py migrate

if [ "$1" == "test" ]
then
./manage.py test
else
    if [ ! -z "$DJANGO_SUPERUSER_USERNAME" ] && [ ! -z "$DJANGO_SUPERUSER_PASSWORD" ]
    then
        ./manage.py createsuperuser --noinput
    fi
    ./manage.py runserver 0.0.0.0:8080
fi
