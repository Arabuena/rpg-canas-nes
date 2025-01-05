const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let masterSocket = null; // Armazena o socket do mestre
let gameState = {}; // Armazena o estado do jogo

app.get('/', (req, res) => {
  res.send('Servidor rodando!');
});

io.on('connection', (socket) => {
  console.log('Novo jogador conectado: ', socket.id);

  // Verificar se é o primeiro jogador a conectar e torná-lo mestre
  if (!masterSocket) {
    masterSocket = socket;
    socket.emit('role', 'master'); // Enviar para o mestre
  } else {
    socket.emit('role', 'player'); // Enviar para os outros jogadores
  }

  // Lidar com a atualização do estado do jogo (só o mestre pode fazer isso)
  socket.on('updateGameState', (newState) => {
    if (socket === masterSocket) {
      gameState = newState; // Atualiza o estado se for o mestre
      io.emit('gameState', gameState); // Envia para todos os jogadores
    }
  });

  // Enviar estado atual do jogo para o jogador ao conectar
  socket.emit('gameState', gameState);

  // Lidar com desconexão
  socket.on('disconnect', () => {
    console.log('Jogador desconectado: ', socket.id);
    if (socket === masterSocket) {
      masterSocket = null; // Recomeça o mestre quando desconectar
    }
  });
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
