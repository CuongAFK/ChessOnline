import React from 'react';

const RoomCard = ({ room, copyRoomId, joinRoom, leaveRoom, startGame, currentRoom, playerId }) => {
    return (
        <div className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-black">
                    Phòng: {room.roomId}
                    <button
                        onClick={() => copyRoomId(room.roomId)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        title="Copy mã phòng"
                    >
                        📋
                    </button>
                </span>
                <span className={`px-2 py-1 rounded ${room.status === 'waiting' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                    }`}>
                    {room.playerCount}/2
                </span>
            </div>
            <div className="text-sm text-gray-600">
                <div>Chủ phòng: {room.player1}</div>
                {room.player2 && <div>Người chơi 2: {room.player2}</div>}
            </div>
            {room.status === 'waiting' && room.player1 !== playerId && (
                <button
                    onClick={() => joinRoom(room.roomId)}
                    className="w-full mt-2 btn btn-outline btn-success"
                >
                    Tham gia
                </button>
            )}

            
            {currentRoom === room.roomId && (
                <>
                {/* Nút Bắt đầu - chỉ hiện cho chủ phòng khi đủ người */}
                    {room.status === 'ready' &&
                        room.player1 === playerId &&
                        room.playerCount === 2 && (
                            <button
                                onClick={() => startGame(room.roomId)}
                                className="w-full mt-2 btn btn-outline btn-primary"
                            >
                                Bắt đầu
                            </button>
                        )}
                        
                    <button
                        onClick={leaveRoom}
                        className="w-full mt-2 btn btn-outline btn-error"
                    >
                        Rời Phòng
                    </button>
                    
                </>
                
            )}
            {/* Hiển thị trạng thái phòng */}
            <div className="mt-2 text-sm">
                <span className={`badge ${
                    room.status === 'waiting' 
                        ? 'badge-warning' 
                        : room.status === 'ready'
                            ? 'badge-info'
                            : 'badge-success'
                }`}>
                    {room.status === 'waiting' 
                        ? 'Đang chờ' 
                        : room.status === 'ready'
                            ? 'Sẵn sàng'
                            : 'Đang chơi'}
                </span>
            </div>
        </div>
    );
};

export default RoomCard;
