const express = require('express');
const httpProxy = require('http-proxy');
const cors = require('cors');
const dotenv = require('dotenv');
const moment = require('moment');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const proxy = httpProxy.createProxyServer();
const servers = process.env.SERVERS.split(',');
let currentServerIndex = 0;

function getNextServer() {
    const nextServer = servers[currentServerIndex];
    currentServerIndex = (currentServerIndex + 1) % servers.length;
    return nextServer;
}

function proxyToNextServer(req, res) {
    const nextServer = getNextServer();
    req.activeServer = nextServer;
    
    // Configurar un timeout de 3 segundos para intentar la conexión con el servidor
    const proxyOptions = {
        target: nextServer,
        timeout: 10000 // Timeout de 3 segundos en milisegundos
    };

    proxy.web(req, res, proxyOptions);
}


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res) => {
    proxyToNextServer(req, res);
});

proxy.on('proxyRes', (proxyRes, req, res) => {
    const formattedDate = moment().format('YYYY-MM-DD');
    const formattedTime = moment().format('HH:mm:ss');
    const payloadLog = req.body ? JSON.stringify(req.body) : "No hay payload";
    console.log(`[${formattedDate}/${formattedTime}] - URL: "${req.originalUrl}" - Método: ${req.method} - Payload: ${payloadLog} - IP del servidor activo: ${req.activeServer}`);
});

proxy.on('error', (err, req, res) => {
    console.error(`Error en el proxy al enviar la solicitud al servidor ${req.activeServer}: ${err.message}`);
    proxyToNextServer(req, res); // Busca el próximo servidor activo
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Balanceador de carga escuchando en el puerto ${port}`);
});
