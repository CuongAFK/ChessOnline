require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

// Thêm biến games để lưu danh sách phòng
const games = new Map(); 
// Lưu danh sách người chơi trong bộ nhớ
const connectedPlayers = new Set();

// Hàm tạo mã phòng ngẫu nhiên 4 ký tự
function generateRoomId() {
    let roomId;
    do {
        roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (games.has(roomId));
    return roomId;
}

io.on('connection', (socket) => {
    console.log('Em socket server: Em đã kết nối với client!', socket.id);

    // Xử lý login
    socket.on('login', (playerId) => {
        console.log('Login attempt:', playerId); 
        if (connectedPlayers.has(playerId)) {
            socket.emit('loginResponse', {
                success: false,
                message: 'Em Login thư ký: ID này đã có người sử dụng! mời anh nhập lại!'
            });
            return;
        }

        connectedPlayers.add(playerId);
        socket.playerId = playerId;

        socket.emit('loginResponse', {
            success: true,
            playerId: playerId,
            message: 'Em Login thư ký: Đăng nhập thành công!'
        });

        socket.emit('roomsList', Array.from(games.values()));
    });

    // Xử lý tạo phòng
    socket.on('createRoom', ({ playerId }) => {
        if (socket.roomId) {
            socket.emit('createRoomResponse', {
                success: false,
                message: 'Bạn đang ở trong một phòng khác!'
            });
            return;
        }

        const roomId = generateRoomId();
        const newRoom = {
            roomId,
            player1: playerId,
            player2: null,
            status: 'waiting',
            playerCount: 1
        };
        
        games.set(roomId, newRoom);
        socket.join(roomId);
        socket.roomId = roomId;
    
        socket.emit('createRoomSuccess', {
            success: true,
            roomId: roomId,
            message: 'Em xử lý tạo phòng: Tạo phòng thành công!'
        });
        
        io.emit('roomsList', Array.from(games.values()));
    });

    // Xử lý tham gia phòng bằng mã
    socket.on('joinRoomById', ({ roomId, playerId }) => {
        const game = games.get(roomId);
        
        if (!game) {
            socket.emit('joinRoomError', {
                message: 'Không tìm thấy phòng!'
            });
            return;
        }

        if (game.status !== 'waiting') {
            socket.emit('joinRoomError', {
                message: 'Phòng đã đầy hoặc đang chơi!'
            });
            return;
        }

        // Cập nhật thông tin phòng
        game.player2 = playerId;
        game.status = 'ready';
        game.playerCount = 2;
        
        socket.join(roomId);
        socket.roomId = roomId;

        // Emit các events cần thiết
        socket.emit('joinRoomSuccess', {
            roomId,
            message: 'Tham gia phòng thành công!'
        });

        console.log( 'Phòng: ' + roomId + ' - ' + game.status);
        
        io.to(roomId).emit('playerJoined', { playerId });
        
        io.emit('roomsList', Array.from(games.values()));
    });

    // Xử lý bắt đầu game
    socket.on('startGame', ({ roomId }) => {
        const game = games.get(roomId);
        
        if (!game || 
            game.player1 !== socket.playerId || 
            game.status !== 'ready' ||
            !game.player2) {
            return;
        }
    
        // Đảm bảo player1 luôn là quân trắng
        game.status = 'playing';
        game.whitePlayer = game.player1;    // Player 1 luôn là trắng
        game.blackPlayer = game.player2;    // Player 2 luôn là đen
    
        // Log để debug
        console.log('Starting game:', {
            roomId,
            player1: game.player1,
            player2: game.player2,
            whitePlayer: game.whitePlayer,
            blackPlayer: game.blackPlayer
        });
    
        // Gửi thông tin đầy đủ cho cả phòng
        io.to(roomId).emit('gameStart', {
            ...game,
            currentTurn: 'white',
            gameState: new Chess().fen(),
            timestamp: Date.now()
        });
        
        io.emit('roomsList', Array.from(games.values()));
    });

    // Xử lý rời phòng
    socket.on('leaveRoom', () => {
        const roomId = socket.roomId;
        if (!roomId) return;

        const game = games.get(roomId);
        if (!game) return;

        if (game.player1 === socket.playerId) {
            // Chủ phòng rời -> xóa phòng
            games.delete(roomId);
            io.to(roomId).emit('roomClosed');
        } else if (game.player2 === socket.playerId) {
            // Người chơi 2 rời -> cập nhật trạng thái phòng
            game.player2 = null;
            game.status = 'waiting';
            game.playerCount = 1;
            io.to(roomId).emit('playerLeft', { playerId: socket.playerId });
        }

        socket.leave(roomId);
        socket.roomId = null;

        io.emit('roomsList', Array.from(games.values()));
    });

    // Xử lý disconnect
    socket.on('disconnect', () => {
        if (socket.roomId) {
            const roomId = socket.roomId;
            const game = games.get(roomId);

            if (game) {
                if (game.player1 === socket.playerId) {
                    games.delete(roomId);
                    io.to(roomId).emit('roomClosed');
                } else if (game.player2 === socket.playerId) {
                    game.player2 = null;
                    game.status = 'waiting';
                    game.playerCount = 1;
                    io.to(roomId).emit('playerLeft', { playerId: socket.playerId });
                }
            }

            socket.leave(roomId);
        }

        if (socket.playerId) {
            connectedPlayers.delete(socket.playerId);
        }

        console.log('Em socket server: Em đã ngắt kết nối với client!', socket.id);
        io.emit('roomsList', Array.from(games.values()));
    });

    socket.on('move', (moveData) => {
        const game = games.get(moveData.roomId);
        if (!game) return;
    
        try {
            const chessGame = new Chess(moveData.fen);
            
            // Validate move
            if (chessGame.isCheckmate()) {
                io.to(moveData.roomId).emit('gameEnd', {
                    winner: moveData.playerId,
                    message: 'Chiếu hết!'
                });
                game.status = 'finished';
            } else if (chessGame.isDraw()) {
                io.to(moveData.roomId).emit('gameEnd', {
                    result: 'draw',
                    message: 'Hòa cờ!'
                });
                game.status = 'finished';
            }
    
            // Broadcast new position
            io.to(moveData.roomId).emit('moveSuccess', {
                fen: moveData.fen,
                move: moveData.move
            });
            
        } catch (error) {
            socket.emit('invalidMove', {
                message: 'Nước đi không hợp lệ!'
            });
        }
    });
});

// Phục vụ các file tĩnh từ thư mục 'frontEnd/dist' (sau khi build frontend)
app.use(express.static(path.join(__dirname, '../frontEnd/dist')));


app.get('/', (req, res) => {
    res.send('Chào mừng đến với server backend cờ vua online!'); // Hoặc nội dung bạn muốn hiển thị
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontEnd/dist', 'index.html'));
});



server.listen(port, () => {
    console.log(`Em server múp rụp: Anh ơi em đang chạy ở cổng ${port}`);
});
