#!/bin/bash

echo "Lista de contenedores de servidores Activos"

docker ps --format "{{.ID}},{{.Ports}},{{.Names}}" > containers.json
