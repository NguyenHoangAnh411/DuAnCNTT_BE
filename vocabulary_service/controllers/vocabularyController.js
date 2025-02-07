const Word = require('../models/vocabModel');
const axios = require('axios');

class VocabController {
    static async getVocabulary(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const uniqueCategories = await Word.distinct('category', { category: { $ne: 'unknown' } });

            const paginatedCategories = uniqueCategories.slice(skip, skip + limit);

            res.status(200).json({
                categories: paginatedCategories,
                hasMore: skip + limit < uniqueCategories.length,
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to fetch categories',
                details: error.message,
            });
        }
    }

    static async getVocabularyByCategory(req, res) {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const startAfter = req.query.startAfter;

        try {
            let query = { category };

            if (startAfter) {
                query._id = { $gt: startAfter };
            }

            const vocabList = await Word.find(query)
                .limit(limit)
                .exec();

            if (vocabList.length === 0) {
                return res.status(404).json({ message: 'No vocabulary found for this category' });
            }

            const lastKey = vocabList.length > 0 ? vocabList[vocabList.length - 1]._id : null;

            res.status(200).json({
                data: vocabList,
                lastKey: lastKey,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server Error', error: error.message });
        }
    }

    static async deleteVocabulary(req, res) {
        const { id } = req.params;

        try {
            const result = await Word.findByIdAndDelete(id);

            if (!result) {
                return res.status(404).json({ message: 'Vocabulary not found' });
            }

            res.status(200).json({ message: 'Vocabulary deleted successfully' });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to delete vocabulary',
                details: error.message,
            });
        }
    }
}

module.exports = VocabController;