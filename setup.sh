#!/bin/bash

rm -fr venv
python3 -m venv venv

source venv/bin/activate

pip install wheel
pip install -r requirements.txt

# Prepare the frontend
npm run build

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

