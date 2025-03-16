const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    player1: {
        type: String,
        required: true
    },
    player2: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['waiting', 'ready', 'playing', 'finished'],
        default: 'waiting'
    },
    moveHistory: [{
        type: String
    }],
    winner: {
        type: String,
        default: null
    }
});
