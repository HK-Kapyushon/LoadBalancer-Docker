# LoadBalancer-Docker

## Project setup
```
npm install axios
```

## Build Docker 
```
docker build -t load-balancer .
```
## Execute Docker directory LoadBalancer-Docker
```
docker run -p 3000:3000 --env-file .env load-balancer
```