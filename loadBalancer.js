const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables de entorno desde el archivo .env

const app = express();
const proxy = httpProxy.createProxyServer();
const servers = process.env.SERVERS.split(','); // Obtiene la lista de servidores desde las variables de entorno

let currentServerIndex = 0;

function getNextServer() {
    const nextServer = servers[currentServerIndex];
    currentServerIndex = (currentServerIndex + 1) % servers.length;
    return nextServer;
}

function proxyToNextServer(req, res) {
    const nextServer = getNextServer();

    proxy.web(req, res, {
        target: nextServer
    });

    proxy.once('error', (err) => {
        console.error(`Error en el proxy al enviar la solicitud al servidor ${nextServer}: ${err.message}`);
        proxyToNextServer(req, res); // Intenta el siguiente servidor en caso de error
    });
}

app.use(cors());

app.use((req, res) => {
    proxyToNextServer(req, res);
});

proxy.on('proxyRes', (proxyRes, req, res) => {
    // Maneja el caso en el que ningún servidor responde
    if (!res.headersSent && proxyRes.statusCode === 502) {
        res.status(502).send('Error: Ninguno de los servidores responde');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Balanceador de carga escuchando en el puerto ${port}`);
});
