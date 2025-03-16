// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game'); // Import model Game

// Route tạo ván cờ mới
router.post('/newGame', async (req, res) => {
    try {
        const { player1, player2 } = req.body; // Giả sử frontend gửi player1 và player2

        const newGame = new Game({
            player1,
            player2
        });

        const savedGame = await newGame.save();
        res.status(201).json(savedGame); // Trả về game vừa tạo
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route lấy thông tin ván cờ theo ID
router.get('/game/:gameId', async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);
        if (!game) {
            return res.status(404).json({ message: 'Em Router cục súc: Bé éo thấy ván cờ này!' });
        }
        res.json(game);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;