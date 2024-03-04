const http = require('http');
const axios = require('axios');

const servers = process.env.SERVERS ? process.env.SERVERS.split(',') : [];
let currentServerIndex = 0;

const getNextServer = () => {
  const server = servers[currentServerIndex];
  currentServerIndex = (currentServerIndex + 1) % servers.length;
  return server;
};

const requestHandler = async (req, res) => {
  try {
    if (servers.length === 0) {
      res.statusCode = 503;
      res.end('No hay servidores disponibles.');
      return;
    }

    const serverUrl = getNextServer();
    console.log(`Solicitud recibida. Utilizando el servidor: ${serverUrl}`);
    
    try {
      const response = await axios.get(serverUrl + req.url, { timeout: 5000 });
      res.statusCode = response.status;
      res.end(response.data);
    } catch (error) {
      console.error(`El servidor ${serverUrl} no está disponible.`);
      res.statusCode = 503;
      res.end('Servidor no disponible');
    }
  } catch (error) {
    console.error('Error en el manejo de la solicitud:', error);
    res.statusCode = 500;
    res.end('Error interno del servidor.');
  }
};

const port = process.env.PORT || 3000;
const server = http.createServer(requestHandler);

server.listen(port, () => {
  console.log(`Balanceador de carga escuchando en el puerto: ${port}`);
});
