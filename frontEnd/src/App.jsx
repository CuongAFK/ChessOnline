import React, { useState, useEffect, useRef } from 'react';
import RoomCard from './components/RoomCard';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

function App() {
    const [socket, setSocket] = useState(null);
    const [playerId, setPlayerId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [boardState, setBoardState] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [gameStatus, setGameStatus] = useState('waiting');
    const [game, setGame] = useState(new Chess());
    const [playerColor, setPlayerColor] = useState('white');
    const playerIdRef = useRef(playerId);

    const handleMove = (sourceSquare, targetSquare) => {
        if (!socket || !currentRoom) return false;

        try {
            const moveColor = game.turn() === 'w' ? 'white' : 'black';
            if (moveColor !== playerColor) {
                alert('Chưa đến lượt của bạn!');
                return false;
            }

            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (move) {
                setGame(new Chess(game.fen()));
                socket.emit('move', {
                    roomId: currentRoom,
                    playerId: playerId,
                    move: { from: sourceSquare, to: targetSquare },
                    fen: game.fen()
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Invalid move:', error);
            return false;
        }
    };

    useEffect(() => {
        playerIdRef.current = playerId;
    }, [playerId]);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('loginResponse', (response) => {
            if (response.success) {
                setIsLoggedIn(true);
                setPlayerId(response.playerId);
                console.log('Logged in with playerId:', response.playerId);
                alert(response.message);
            } else {
                alert(response.message);
                setPlayerId('');
            }
        });

        newSocket.on('createRoomSuccess', (response) => {
            if (response.success) {
                setCurrentRoom(response.roomId);
                console.log('Room created:', response.roomId);
                alert(response.message);
            }
        });

        newSocket.on('createRoomError', (response) => {
            alert(response.message);
        });

        newSocket.on('roomsList', (roomsList) => {
            setRooms(roomsList);
        });

        newSocket.on('gameUpdate', (data) => {
            setBoardState(data.boardState);
            setCurrentRoom(data.roomId);
        });

        newSocket.on('roomClosed', () => {
            alert('Phòng đã bị đóng!');
            setCurrentRoom(null);
        });

        newSocket.on('playerLeft', ({ playerId }) => {
            alert(`Người chơi ${playerId} đã rời phòng!`);
        });

        newSocket.on('playerJoined', ({ playerId }) => {
            alert(`Người chơi ${playerId} đã tham gia phòng!`);
        });

        newSocket.on('joinRoomSuccess', (data) => {
            setCurrentRoom(data.roomId);
            setGameStatus('ready');
            alert('Tham gia phòng thành công!');
        });

        newSocket.on('joinRoomError', (data) => {
            alert(data.message);
            setCurrentRoom(null);
        });

        newSocket.on('gameStart', (game) => {
            const currentPlayerId = playerIdRef.current;
            const isWhite = game.whitePlayer === currentPlayerId;
            setPlayerColor(isWhite ? 'white' : 'black');
            setGameStatus('playing');
            setGame(new Chess());
        });

        newSocket.on('invalidMove', (data) => {
            alert(data.message);
        });

        newSocket.on('moveSuccess', (data) => {
            setGame(new Chess(data.fen));
        });

        return () => newSocket.disconnect();
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (playerId.trim()) {
            socket.emit('login', playerId);
        }
    };

    const createRoom = () => {
        if (!playerId) {
            alert('Vui lòng đăng nhập trước!');
            return;
        }
        if (currentRoom) {
            alert('Bạn đang ở trong một phòng khác!');
            return;
        }
        socket.emit('createRoom', { playerId });
    };

    const joinRoom = (roomId) => {
        if (currentRoom) {
            alert('Bạn đang ở trong một phòng khác!');
            return;
        }
        socket.emit('joinRoomById', { roomId, playerId });
    };

    const copyRoomId = (roomId) => {
        navigator.clipboard.writeText(roomId);
        alert('Đã copy mã phòng!');
    };

    const handleJoinRoomById = (e) => {
        e.preventDefault();
        if (joinRoomId.trim()) {
            joinRoom(joinRoomId);
            setJoinRoomId('');
        }
    };

    const leaveRoom = () => {
        socket.emit('leaveRoom');
        setCurrentRoom(null);
        setGameStatus('waiting');
    };

    const startGame = (roomId) => {
        if (socket && currentRoom === roomId) {
            socket.emit('startGame', { roomId });
            setGameStatus('playing');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl text-primary font-bold mb-4">Đăng nhập Chess Online</h1>
                    <input
                        type="text"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        placeholder="Nhập ID của bạn"
                        className="w-full p-2 border rounded mb-4 text-black"
                    />
                    <button type="submit" className="w-full btn btn-outline btn-success">
                        Vào Game
                    </button>
                </form>
            </div>
        );
    }

    if (isLoggedIn) {
        if (gameStatus === 'waiting' || gameStatus === 'ready') {
            return (
                <div className="container mx-auto p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Chess Online - {playerId}</h1>
                        <button
                            onClick={() => setIsLoggedIn(false)}
                            className="btn btn-outline btn-error"
                        >
                            Thoát
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow text-black">
                            <h2 className="text-xl font-bold mb-4">Tạo/Tham gia phòng</h2>
                            <button
                                onClick={createRoom}
                                className="w-full btn btn-outline btn-primary mb-4"
                            >
                                Tạo Phòng Mới
                            </button>

                            <form onSubmit={handleJoinRoomById} className="space-y-2">
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                    placeholder="Nhập mã phòng"
                                    className="w-full p-2 border rounded"
                                    maxLength={4}
                                />
                                <button
                                    type="submit"
                                    className="w-full btn btn-outline btn-success"
                                >
                                    Vào Phòng
                                </button>
                            </form>
                        </div>

                        <div className="bg-white text-black p-4 rounded-lg shadow">
                            <h2 className="text-xl  font-bold mb-4">Danh sách phòng</h2>
                            <div className="space-y-2">
                                {rooms.map(room => (
                                    <RoomCard
                                        key={room.roomId}
                                        room={room}
                                        copyRoomId={copyRoomId}
                                        joinRoom={joinRoom}
                                        leaveRoom={leaveRoom}
                                        startGame={startGame}
                                        currentRoom={currentRoom}
                                        playerId={playerId}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    if (gameStatus === 'playing') {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-between">
                    <div className="w-[600px]">
                        <Chessboard
                            position={game.fen()}
                            onPieceDrop={handleMove}
                            boardOrientation={playerColor}
                            customBoardStyle={{
                                borderRadius: '4px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                            }}
                            customDarkSquareStyle={{ backgroundColor: '#769656' }}
                            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
                        />
                    </div>
                    <div className="w-64 ml-4">
                        <div className="bg-white p-4 rounded shadow text-black">
                            <h2 className="text-xl font-bold mb-2">Thông tin ván đấu</h2>
                            <div>Phòng: {currentRoom}</div>
                            <div>Player ID: {playerId}</div>
                            <div>Quân của bạn: {playerColor === 'white' ? 'Trắng' : 'Đen'}</div>
                            <div>Lượt: {game.turn() === 'w' ? 'Trắng' : 'Đen'}</div>
                            {game.isCheck() && (
                                <div className="text-red-500 font-bold mt-2">Chiếu!</div>
                            )}
                            <button
                                onClick={leaveRoom}
                                className="btn btn-error btn-sm mt-4 w-full"
                            >
                                Rời Phòng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;