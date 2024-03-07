# LoadBalancer-Docker

## Project setup
```
npm install axios
```
## Create Image Balancer Docker
```
docker build -t balancer -f Dockerfile-loadBalancer .
```
## Create Container Balancer Docker
```
docker run -d -p 3000:3000 --name balancer load-balancer
```
## search ip docker
```
docker exec NAME_CONTAINER hostname -i
```