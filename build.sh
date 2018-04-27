#!/bin/bash

# SERVICES=("auth" "message" "socketio" "ui" "user")
SERVICES=("ui")

for SERVICE in "${SERVICES[@]}"
do
  docker build -t flask-chat-micro-$SERVICE:1.0 -f $SERVICE/Dockerfile .
done
