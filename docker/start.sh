#!/bin/bash

./setup.sh
./manage.py makemigrations
./manage.py migrate

if [ "$1" == "test" ]
then
./manage.py test
else
    if [ ! -z "$SUPERUSER_USER"] && [ -z "$SUPERUSER_PASS" ]
    then
        ./manage.py createsuperuser --username "$SUPERUSER_USER" --noinput --password "$SUPERUSER_PASS"
    fi
    ./manage.py runserver 0.0.0.0:8080
fi
