#!/bin/bash

# SERVICES=("auth" "message" "socketio" "ui" "user")
SERVICES=("ui")

export HOST_IP_ADDRESS=`ifconfig docker | grep 'inet addr' | cut -d: -f2 | awk '{ print $1}'`
export ETCD_IP_ADDRESS=`ifconfig docker | grep 'inet addr' | cut -d: -f2 | awk '{ print $1}' | awk -F '.' '{ print $1"."$2"."$3"."$4+1 }'`
export ETCD=http://$ETCD_IP_ADDRESS:2379

docker run --name etcd -d --restart always -p 2379:2379 -p 2380:2380 miguelgrinberg/easy-etcd:latest
docker run --name lb -d --restart always -p 80:80 -e ETCD_PEERS=$ETCD -e HAPROXY_STATS=1 miguelgrinberg/easy-lb-haproxy:latest

for SERVICE in "${SERVICES[@]}"
do
  docker run -d -P -e HOST_IP_ADDRESS=$HOST_IP_ADDRESS -e ETCD=$ETCD -v /var/run/docker.sock:/var/run/docker.sock flask-chat-micro-$SERVICE:1.0
done
