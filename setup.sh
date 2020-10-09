#!/bin/bash

rm -fr venv
python3 -m venv venv

source venv/bin/activate

pip install wheel
pip install -r requirements.txt

mkdir -p dl
# Fetch jquery
JQUERY_VERSION=3.4.1
JQUERY_FILE=jquery-${JQUERY_VERSION}.min.js
if [ ! -f dl/${JQUERY_FILE} ]
then
        curl -L https://code.jquery.com/${JQUERY_FILE} -o dl/${JQUERY_FILE}
fi
mkdir -p main/static/jquery/
cp dl/${JQUERY_FILE} main/static/jquery/jquery.js


# Create the local settings file from the template
if [ ! -f fss/local_settings.py ]
then
	grep -q docker /proc/self/cgroup
	RETCODE=$?
	if [ $RETCODE -eq 0 ]
    then
		cp docker/local_settings.py fss/local_settings.py
	else
        cp fss/local_settings.py.template fss/local_settings.py
	fi

    echo ""
    echo "Create fss/local_settings.py from template"
    echo "You should check this reflects your required settings"
    echo "At a minimum you will need to set your postgis parameters"
fi

[ ! -z "$DB_HOST" ] && sed -i "s|'HOST': .*|'HOST': '$DB_HOST',|" fss/local_settings.py || true
[ ! -z "$DB_USER" ] && sed -i "s|'USER': .*|'USER': '$DB_USER',|" fss/local_settings.py || true
[ ! -z "$DB_NAME" ] && sed -i "s|'NAME': .*|'NAME': '$DB_NAME',|" fss/local_settings.py || true
[ ! -z "$DB_PASS" ] && sed -i "s|'PASSWORD': .*|'PASSWORD': '$DB_PASS',|" fss/local_settings.py || true

cat fss/local_settings.py

if [ ! -f fss/secretkey.txt ]
then
    python -c 'import random; result = "".join([random.choice("abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)") for i in range(50)]); print(result)' > fss/secretkey.txt  $
    echo ""
    echo "Created new secretkey.txt in fss/secretkey.txt"
fi

echo "Start in development mode:"
echo "./start.sh"
echo "You may need to create an admin user with './manage.py createsuperuser'"

