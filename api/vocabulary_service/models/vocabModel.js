const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
    category: { type: String, required: true },
    word: { type: String, required: true, unique: true },
}, { timestamps: true });

const Word = mongoose.model('Word', wordSchema);

module.exports = Word;