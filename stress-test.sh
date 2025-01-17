#!/bin/bash
target=${1:-"http://localhost:5000"}
while true
do 
  for i in $(seq 100)
  do
    curl $target >/dev/null &
  done
  wait
done
