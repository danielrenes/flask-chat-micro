echo Stopping docker containers...
docker stop $(docker ps -q -a)
echo Removing docker containers...
docker rm $(docker ps -q -a)
