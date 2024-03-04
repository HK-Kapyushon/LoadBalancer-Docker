// Se importan los módulos 'http' y 'axios'
const http = require('http');
const axios = require('axios');

// Se obtienen los servidores disponibles del entorno, separados por coma, si los hay.
const servers = process.env.SERVERS ? process.env.SERVERS.split(',') : [];

// Se inicializa el índice del servidor actual en 0.
let currentServerIndex = 0;

// Función para obtener el próximo servidor disponible en la lista de servidores.
const getNextServer = () => {
  const server = servers[currentServerIndex];
  // Se incrementa el índice para obtener el siguiente servidor, ciclando al inicio si se llega al final de la lista.
  currentServerIndex = (currentServerIndex + 1) % servers.length;
  return server;
};

// Función de manejo de solicitud (requestHandler) que se ejecutará cuando llegue una solicitud HTTP.
const requestHandler = async (req, res) => {
  try {
    // Si no hay servidores disponibles, se responde con un código de estado 503 y un mensaje de error.
    if (servers.length === 0) {
      res.statusCode = 503;
      res.end('No hay servidores disponibles.');
      return;
    }

    // Se obtiene el próximo servidor disponible.
    const serverUrl = getNextServer();
    console.log(`Solicitud recibida. Utilizando el servidor: ${serverUrl}`);
    
    try {
      // Se hace una solicitud GET al servidor correspondiente, con un tiempo de espera (timeout) de 5 segundos.
      const response = await axios.get(serverUrl + req.url, { timeout: 5000 });
      // Se establece el código de estado de la respuesta según el código de estado recibido del servidor.
      res.statusCode = response.status;
      // Se envía el cuerpo de la respuesta del servidor al cliente que realizó la solicitud.
      res.end(response.data);
    } catch (error) {
      // Si ocurre un error al hacer la solicitud al servidor, se registra en la consola y se responde al cliente con un código de estado 503 y un mensaje de error.
      console.error(`El servidor ${serverUrl} no está disponible.`);
      res.statusCode = 503;
      res.end('Servidor no disponible');
    }
  } catch (error) {
    // Si ocurre un error en el manejo de la solicitud, se registra en la consola y se responde al cliente con un código de estado 500 y un mensaje de error.
    console.error('Error en el manejo de la solicitud:', error);
    res.statusCode = 500;
    res.end('Error interno del servidor.');
  }
};

// Se especifica el puerto en el que el balanceador de carga escuchará las solicitudes, utilizando el valor del puerto definido en el entorno o el puerto 3000 por defecto.
const port = process.env.PORT || 3000;
// Se crea un servidor HTTP que utilizará la función de manejo de solicitud definida anteriormente.
const server = http.createServer(requestHandler);

// Se inicia el servidor y se muestra un mensaje en la consola indicando en qué puerto está escuchando.
server.listen(port, () => {
  console.log(`Balanceador de carga escuchando en el puerto: ${port}`);
});
