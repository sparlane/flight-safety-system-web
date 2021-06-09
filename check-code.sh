#!/bin/bash -e

source venv/bin/activate

PATHS="fss/ main/ config/ assets/"

isort --check --diff ${PATHS}

pycodestyle --ignore=E501 */*.py

pylint --max-line-length=240 --load-plugins pylint_django --django-settings-module=fss.settings ${PATHS}

deactivate

