#!/bin/bash -e

source venv/bin/activate

pycodestyle --ignore=E501 */*.py

pylint --max-line-length=240 --load-plugins pylint_django fss/ main/ config/ assets/

deactivate

