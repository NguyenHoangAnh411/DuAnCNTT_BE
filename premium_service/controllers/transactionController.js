const { database } = require('../../services/firebaseService');

class TransactionController {
    static async getCompletedTransaction(req, res) {
        try {
            const completedTransactionRef = database.ref('completed_transactions');
            const snapshot = await completedTransactionRef.once('value');
            const data = snapshot.val() || {};

            const result = Object.keys(data).map(key => ({ id: key, ...data[key] }))

            return res.status(200).json(result);
        } catch (e) {
            res.status(500).json({ error: 'Failed to fetch Completed Transaction', details: error.message });
        }
    }

    static async getPendingTransaction(req, res) {
        try {
            const pendingTransactionRef = database.ref('pending_transactions');
            const snapshot = await pendingTransactionRef.once('value');
            const data = snapshot.val() || {};

            const result = Object.keys(data).map(key => ({ id: key, ...data[key] }))

            return res.status(200).json(result);
        } catch (e) {
            res.status(500).json({ error: 'Failed to fetch Pending Transaction', details: error.message });
        }
    }
}

module.exports = TransactionController;