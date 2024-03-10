const express = require('express');
const app = express();
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

app.use(cors());
app.use(express.json()); // Middleware para analizar JSON en solicitudes POST

dotenv.config();

const servers = process.env.SERVERS.split(',').map(server => server.trim());
let currentServerIndex = 0;

app.use((req, res, next) => {
    const server = servers[currentServerIndex];
    const timestamp = new Date().toISOString();
  
    // Utilizamos axios.request para manejar todas las solicitudes
    axios.request({
      method: req.method,
      url: `http://${server}${req.url}`,
      data: req.body
    })
    .then(response => {
      console.log(`[${timestamp}] - URL: ${req.url} Metodo: ${response.status} ${response.statusText} Servidor: ${server} `);
      res.send(response.data);
      currentServerIndex = (currentServerIndex + 1) % servers.length;
    })
    .catch(error => {
      // Registro de errores
      console.error(`Error while connecting to ${server}:`, error.message);
      currentServerIndex = (currentServerIndex + 1) % servers.length;
      res.status(500).send('An error occurred while processing the request.');
    });
  });
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`El balanceador de carga escucha al puerto: ${PORT}`);
});