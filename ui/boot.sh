#!/bin/sh

python -c "from common import register_container; register_container('ui')" > register_log &

exec gunicorn -b 0.0.0.0:5000 app:app
