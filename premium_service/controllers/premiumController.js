const { admin, database } = require('../../services/firebaseService');

class PremiumController {
    static async updatePremiumStatus(req, res) {
        try {
            const { userId, transactionId, durationDays } = req.body;
            if (!userId || !transactionId || !durationDays) {
              return res.status(400).json({ message: 'Thiếu thông tin yêu cầu' });
            }

            const now = Date.now();
            const expiry = now + durationDays * 24 * 60 * 60 * 1000;

            await database.ref(`users/${userId}/premium`).set({
              isPremium: true,
              premiumStart: now,
              premiumExpiry: expiry,
              transactionId,
            });
        
            return res.status(200).json({ message: 'Kích hoạt premium thành công' });
          } catch (error) {
            console.error('Lỗi kích hoạt premium:', error);
            return res.status(500).json({ message: 'Lỗi server' });
          }
    }

    static async checkPremiumStatus(req, res) {
        try {
            const { userId } = req.params;
            const snapshot = await database.ref(`users/${userId}/premium`).once('value');
            const premiumData = snapshot.val();

            if (premiumData && premiumData.isPremium && premiumData.premiumExpiry > Date.now()) {
              return res.status(200).json({ isPremium: true, ...premiumData });
            } else {
              return res.status(200).json({ isPremium: false });
            }
          } catch (error) {
            console.error('Lỗi kiểm tra premium:', error);
            return res.status(500).json({ message: 'Lỗi server' });
          }
    }

    static async cancelPremium(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
              return res.status(400).json({ message: 'Thiếu userId' });
            }

            await database.ref(`users/${userId}/premium`).set({
              isPremium: false,
              premiumStart: null,
              premiumExpiry: null,
              transactionId: null,
            });
        
            return res.status(200).json({ message: 'Hủy premium thành công' });
          } catch (error) {
            console.error('Lỗi hủy premium:', error);
            return res.status(500).json({ message: 'Lỗi server' });
          }
    }
}

module.exports = PremiumController;