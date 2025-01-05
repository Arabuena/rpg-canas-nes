const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let rooms = {}; // Armazena as salas de jogo

wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');
    
    ws.on('message', (message) => {
        let msg = JSON.parse(message);

        // Se for uma solicitação de entrar na sala
        if (msg.type === 'joinRoom') {
            const roomId = msg.roomId;
            const playerName = msg.playerName;
            const avatar = msg.avatar;

            if (!rooms[roomId]) {
                rooms[roomId] = { players: [], master: null };
            }

            // Define o mestre (primeiro jogador a entrar)
            if (rooms[roomId].players.length === 0) {
                rooms[roomId].master = playerName;
            }

            // Adiciona o jogador à sala
            rooms[roomId].players.push({ playerName, avatar, role: rooms[roomId].master === playerName ? 'mestre' : 'espectador' });

            // Envia para todos os jogadores na sala as informações de quem está na sala
            rooms[roomId].players.forEach(player => {
                // Envia a mensagem 'playerJoined' para todos os jogadores na sala
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'playerJoined', playerName: player.playerName, role: player.role }));
                    }
                });
            });
        }

        // Envia atualizações sobre o jogo para todos os jogadores
        if (msg.type === 'gameAction') {
            const roomId = msg.roomId;
            const action = msg.action;

            // Envia a ação para todos os jogadores da sala, exceto o que enviou a ação
            rooms[roomId].players.forEach(player => {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'gameUpdate', action }));
                    }
                });
            });
        }
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
        // Aqui você pode adicionar lógica para remover o jogador da sala e ajustar a lista de jogadores
    });
});

console.log('Servidor WebSocket rodando na porta 8080');
