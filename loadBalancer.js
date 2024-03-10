require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const app = express();

app.use(cors());

let servers = process.env.SERVERS ? process.env.SERVERS.split(',') : [];
let currentIndex = 0;

function checkServerStatus() {
    servers.forEach((server) => {
        const options = {
            method: 'HEAD',
        };

        const checkReq = http.request(server.trim(), options, (res) => {
            if (res.statusCode === 200) {
                console.log(`El servidor ${server} está activo.`);
            } else {
                console.error(`El servidor ${server} está caído.`);
            }
        });

        checkReq.on('error', (error) => {
            console.error(`Error al verificar el servidor ${server}: ${error}`);
        });

        checkReq.end();
    });
}

const statusCheckInterval = setInterval(checkServerStatus, 5 * 60 * 1000);

function handleRequest(req, res, next) {
    const activeServer = servers[currentIndex];
    currentIndex = (currentIndex + 1) % servers.length;

    let bodyData = [];
    req.on('data', (chunk) => {
        bodyData.push(chunk);
    }).on('end', () => {
        bodyData = Buffer.concat(bodyData).toString();
        const options = {
            method: req.method,
            path: req.url,
            headers: req.headers
        };

        const proxyReq = http.request({
            hostname: activeServer.split(':')[0],
            port: activeServer.split(':')[1],
            ...options
        }, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
                console.error(`Respuesta de error del servidor ${activeServer}: ${proxyRes.statusCode}`);
                res.status(proxyRes.statusCode).send('Error del servidor');
                return next();
            }

            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10);
            const formattedTime = date.toTimeString().slice(0, 8);
            const payloadLog = bodyData ? JSON.stringify(bodyData) : '';
            console.log(`[${formattedDate}/${formattedTime}] - URL: "${req.originalUrl}" - Método: ${req.method} - Payload: ${payloadLog} - IP del servidor activo: ${activeServer}`);
        });

        proxyReq.on('error', (error) => {
            console.error(`Error en la solicitud proxy a ${activeServer}: ${error}`);
            res.status(500).send('Error interno del servidor');
            next(error);
        });

        req.pipe(proxyReq, { end: true });
    });
}

app.all('*', handleRequest);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Balanceador de carga en ejecución en el puerto ${PORT}`);
});
