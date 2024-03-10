const express = require('express');
const app = express();
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

app.use(cors());
app.use(express.json());
dotenv.config();

const servers = process.env.SERVERS.split(',').map(server => server.trim());
let currentServerIndex = 0;

app.use((req, res, next) => {
  let attemptCount = 0;
  const maxAttempts = servers.length;

  function attemptRequest() {
    const server = servers[currentServerIndex];
    const timestamp = new Date().toISOString();

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
      console.error(`Error de conexión con ${server}:`, error.message);
      
      // Intentar con el siguiente servidor disponible
      currentServerIndex = (currentServerIndex + 1) % servers.length;
      
      // Si no se han alcanzado el límite de intentos, volver a intentar la solicitud con el siguiente servidor
      if (attemptCount < maxAttempts - 1) {
        attemptCount++;
        attemptRequest();
      } else {
        // Si se han alcanzado el límite de intentos, pasar al siguiente middleware
        next();
      }
    });
  }
  attemptRequest();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`El balanceador de carga escucha al puerto: ${PORT}`);
});