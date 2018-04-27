#!/bin/bash

export HOST_IP_ADDRESS=`ifconfig docker | grep 'inet addr' | cut -d: -f2 | awk '{ print $1}'`
export IP_ADDRESS=`ifconfig docker | grep 'inet addr' | cut -d: -f2 | awk '{ print $1}' | awk -F '.' '{ print $1"."$2"."$3"."$4+1 }'`
export ETCD=http://$IP_ADDRESS:2379

function usage {
  echo "Usage: manage.sh <command> <number> <service>"
  echo "  command:"
  echo "    run, stop, remove"
  echo "  number:"
  echo "    1..10"
  echo "  service:"
  echo "    api, auth, socketio, ui"
}

CMD=$1
NUMBER=$2
SERVICE=$3

if [ "$CMD" = "" -o "$NUMBER" = "" -o "$SERVICE" = "" ]
then
  usage
  exit 1
fi

if [ "$CMD" != "run" -a "$CMD" != "stop" -a "$CMD" != "rm" ]
then
  usage
  exit 1
fi

if [ $NUMBER -lt 1 -o $NUMBER -gt 10 ]
then
  usage
  exit 1
fi

if [ "$SERVICE" != "auth" -a "$SERVICE" != "message" -a "$SERVICE" != "socketio" -a "$SERVICE" != "ui" -a "$SERVICE" != "user" ]
then
  usage
  exit 1
fi

if [ "$CMD" = "run" ]
then
  for i in $(eval echo {1..$NUMBER})
  do
    docker run -d -P -e HOST_IP_ADDRESS=$HOST_IP_ADDRESS -e ETCD=$ETCD -v /var/run/docker.sock:/var/run/docker.sock flask-chat-micro-$SERVICE:1.0
  done
else
  CONTAINER_IDS=($(echo `docker ps -q -a -f ancestor=flask-chat-micro-$SERVICE:1.0` | tr " " "\n"))
  for i in "${!CONTAINER_IDS[@]}"
  do
    if [ $i -le $((NUMBER-1)) ]
    then
      docker $CMD ${CONTAINER_IDS[$i]}
    fi
  done
fi
