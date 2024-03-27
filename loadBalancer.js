const express = require('express');
const app = express();
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');

app.use(cors());
app.use(express.json());
dotenv.config();

let SERVERS = "";

function updateServers(ip, port) {
    try {
        const newServer = `${ip}:${port}`;
        if (!SERVERS.includes(newServer)) {
            SERVERS += (SERVERS ? ',' : '') + newServer;
            console.log("Lista de IP y Puertos actualizada:");
            console.log(SERVERS);
        }
    } catch (error) {
        console.error('Error al actualizar SERVERS:', error);
    }
}

app.post('/register-node', (req, res) => {
    const { ip, port } = req.body;
    
    console.log(`Nodo registrado: IP ${ip}, Puerto ${port}`);
    
    updateServers(ip, port);
    
    res.status(200).send('Nodo registrado exitosamente');
});

let currentIndex = 0; // Índice actual de servidor
app.use((req, res, next) => {
    const servers = SERVERS.split(',').filter(server => server); // Eliminar valores vacíos
    const serverCount = servers.length;

    if (serverCount === 0) {
        console.error('No hay servidores disponibles.');
        res.status(500).send('No hay servidores disponibles.');
        return;
    }

    // Determinar qué servidor manejará esta solicitud
    const serverIndex = currentIndex % serverCount;
    const server = servers[serverIndex];

    // Incrementar el índice para la próxima solicitud
    currentIndex++;

    const timestamp = new Date().toISOString();

    axios.request({
        method: req.method,
        url: `http://${server}${req.url}`,
        data: req.body
    })
    .then(response => {
        console.log(`[${timestamp}] - URL: ${req.url} Método: ${response.status} ${response.statusText} Servidor: ${server}`);
        res.send(response.data);
    })
    .catch(error => {
        console.error(`Error de conexión con ${server}:`, error.message);
        // Si hay un error, continuar con el siguiente servidor
        next();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`El balanceador de carga escucha al puerto: ${PORT}`);
});
