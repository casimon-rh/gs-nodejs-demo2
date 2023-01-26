#!/bin/bash
docker build --compress -t service:simple .
docker network create chains 1>/dev/null 2>/dev/null
docker rm -f aa 1>/dev/null 2>/dev/null
docker rm -f bb 1>/dev/null 2>/dev/null
docker rm -f cc 1>/dev/null 2>/dev/null

docker run --network=chains -p 3000:3000 -e JUMPS=3 \
  -e ID=A -e NEXT_SVC=http://bb:3000 -e CHAIN_SVC=http://bb:3000/chain \
  --name aa -d docker.io/library/service:simple
docker run --network=chains -e JUMPS=3 \
  -e ID=B -e NEXT_SVC=http://cc:3000 -e CHAIN_SVC=http://cc:3000/chain \
  --name bb -d docker.io/library/service:simple
docker run --network=chains -e JUMPS=3 \
  -e ID=C -e NEXT_SVC=http://aa:3000 -e CHAIN_SVC=http://aa:3000/chain \
  -e INJECT_ERR=1 --name cc -d docker.io/library/service:simple
