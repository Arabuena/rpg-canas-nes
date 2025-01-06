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

            // Se a sala não existir, cria uma nova sala
            if (!rooms[roomId]) {
                rooms[roomId] = { players: [], master: null };
            }

            // Define o mestre (primeiro jogador a entrar)
            if (rooms[roomId].players.length === 0) {
                rooms[roomId].master = playerName;
            }

            // Adiciona o jogador à sala
            const role = rooms[roomId].master === playerName ? 'mestre' : 'espectador';
            rooms[roomId].players.push({ playerName, avatar, role });

            // Envia para todos os jogadores na sala as informações de quem está na sala
            rooms[roomId].players.forEach(player => {
                wss.clients.forEach(client => {
                    // Envia para os clientes que estão na mesma sala
                    if (client.readyState === WebSocket.OPEN && client !== ws) {
                        client.send(JSON.stringify({
                            type: 'playerJoined', 
                            playerName: player.playerName, 
                            role: player.role 
                        }));
                    }
                });
            });

            // Informa ao novo jogador sua posição (mestre ou espectador)
            ws.send(JSON.stringify({
                type: 'roomInfo', 
                role: role, 
                roomId: roomId, 
                players: rooms[roomId].players 
            }));
        }

        // Envia atualizações sobre o jogo para todos os jogadores na sala
        if (msg.type === 'gameAction') {
            const roomId = msg.roomId;
            const action = msg.action;

            // Envia a ação para todos os jogadores da sala
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
        // Aqui você pode adicionar lógica para remover o jogador da sala
    });
});

console.log('Servidor WebSocket rodando na porta 8080');
