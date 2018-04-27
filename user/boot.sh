#!/bin/sh

python -c "from common import register_container; register_container('user')" &

# exec gunicorn -b 0.0.0.0:5000 app:app
exec python app.py
