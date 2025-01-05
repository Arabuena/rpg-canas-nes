const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let master = null; // Armazena o socket do mestre
let players = [];  // Armazena os sockets dos jogadores

// Quando um jogador se conecta
io.on('connection', (socket) => {
    console.log('Um jogador se conectou');
    
    // Verifica se o jogador é o mestre (primeiro a conectar)
    if (!master) {
        master = socket;
        socket.emit('setRole', 'master'); // Envia para o mestre
    } else {
        players.push(socket);
        socket.emit('setRole', 'player'); // Envia para o jogador
    }

    // Evento de desconexão
    socket.on('disconnect', () => {
        console.log('Jogador desconectado');
        if (socket === master) {
            master = null; // Resetando o mestre
        } else {
            players = players.filter(player => player !== socket);
        }
    });

    // Evento para o mestre alterar objetos no jogo
    socket.on('changeObject', (data) => {
        if (socket === master) {
            // Envia a mudança para todos os jogadores
            io.emit('updateGame', data);
        }
    });

    // Evento para o mestre contar a história
    socket.on('tellStory', (story) => {
        if (socket === master) {
            // Envia a história para todos os jogadores
            io.emit('updateStory', story);
        }
    });
});

// Servir os arquivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Servidor ouvindo na porta 3000');
});
