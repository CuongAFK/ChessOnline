// src/components/Chessboard.jsx
import React, { useState } from 'react';

// Định nghĩa ký hiệu cho từng loại quân cờ
// r = rook (xe đen), n = knight (mã đen), b = bishop (tượng đen)
// q = queen (hậu đen), k = king (vua đen), p = pawn (tốt đen)
// Chữ in hoa tương ứng với quân trắng
const pieceSymbols = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const Chessboard = ({ boardState, onMove }) => {
    // Lưu trạng thái ô được chọn (để di chuyển quân cờ)
    const [selectedSquare, setSelectedSquare] = useState(null);
    
    // Hàm chuyển đổi từ ký hiệu FEN sang mảng 2 chiều
    const parseFEN = (fen) => {
        // Tách lấy phần vị trí quân cờ từ chuỗi FEN
        const [position] = fen.split(' ');
        // Tách thành các hàng
        const rows = position.split('/');
        const board = [];
        
        rows.forEach(row => {
            const squares = [];
            // Duyệt từng ký tự trong hàng
            for (let char of row) {
                if (isNaN(char)) {
                    // Nếu là chữ cái -> thêm vào là quân cờ
                    squares.push(char);
                } else {
                    // Nếu là số -> thêm số ô trống tương ứng
                    squares.push(...Array(parseInt(char)).fill(''));
                }
            }
            board.push(squares);
        });
        
        return board;
    };

    // Xử lý sự kiện click vào ô cờ
    const handleSquareClick = (row, col) => {
        if (!selectedSquare) {
            // Nếu chưa có ô nào được chọn -> lưu ô được click
            setSelectedSquare({ row, col });
        } else {
            // Nếu đã có ô được chọn -> thực hiện di chuyển
            onMove({
                from: selectedSquare, // Ô xuất phát
                to: { row, col }      // Ô đích
            });
            setSelectedSquare(null);  // Xóa ô đã chọn
        }
    };

    // Chuyển đổi từ FEN sang mảng 2 chiều
    const board = parseFEN(boardState);
    
    // Render bàn cờ
    return (
        <div className="grid grid-cols-8 border-2 border-gray-800 w-fit">
            {board.map((row, rowIndex) => (
                row.map((piece, colIndex) => {
                    // Tính màu nền cho ô cờ (đen/trắng xen kẽ)
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    // Kiểm tra xem ô có đang được chọn không
                    const isSelected = selectedSquare?.row === rowIndex && 
                                     selectedSquare?.col === colIndex;
                    
                    return (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                                w-16 h-16 flex items-center justify-center text-4xl
                                ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                                ${isSelected ? 'bg-yellow-300' : ''}
                                cursor-pointer
                            `}
                            onClick={() => handleSquareClick(rowIndex, colIndex)}
                        >
                            {pieceSymbols[piece]} {/* Hiển thị quân cờ */}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default Chessboard;