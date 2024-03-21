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

let ipPorts = [];
let SERVERS = '';

// Función para ejecutar el script que genera container.json en Windows
function runScript() {
    exec('cmd /c dockerls.bat', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error de salida estándar del script: ${stderr}`);
            return;
        }
        console.log(`Salida del script: ${stdout}`);
        extractIPPorts(); // Después de ejecutar el script, extraemos las IPs y puertos
    });
}

// Función para extraer IPs y puertos del archivo container.json
function extractIPPorts() {
    try {
        const containerData = JSON.parse(fs.readFileSync('containers.json', 'utf8'));
        ipPorts = containerData.map(container => `localhost:${container.PORTS.split('->')[0].split(':')[1]}`);
        console.log("Lista de IP y Puertos:");
        console.log(ipPorts); // Imprimir la lista de IPs y puertos en la consola
        SERVERS = ipPorts.join(',');
        console.log("SERVERS:", SERVERS); // Imprimir SERVERS después de actualizarlo
    } catch (error) {
        console.error('Error al leer o parsear el archivo containers.json:', error);
    }
}


// Ejecutar el script al inicio de la aplicación
runScript();

// Primera ejecución al inicio de la aplicación
extractIPPorts();

// Verificar cambios en container.json cada 10 segundos
setInterval(() => {
    runScript(); // Ejecutar el script para actualizar container.json
    extractIPPorts(); // Extraer IPs y puertos del nuevo archivo
}, 10000);

// Middleware de balanceo de carga
let currentIndex = 0; // Índice actual de servidor
app.use((req, res, next) => {
    const servers = SERVERS.split(',');
    const serverCount = servers.length;

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
