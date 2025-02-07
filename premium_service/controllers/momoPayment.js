const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');

class MomoPayment {
    static async createPayment(req, res) {
        const { amount, orderInfo, userId } = req.body;

        const orderId = `${config.partnerCode}${Date.now()}`;
        const extraData = Buffer.from(JSON.stringify({ userId })).toString('base64');

        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${orderId}&requestType=payWithMethod`;
        
        const signature = crypto.createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode: config.partnerCode,
            requestId: orderId,
            amount,
            orderId,
            orderInfo,
            redirectUrl: config.redirectUrl,
            ipnUrl: config.ipnUrl,
            lang: 'vi',
            requestType: "payWithMethod",
            extraData,
            signature
        };

        try {
            const result = await axios.post(config.momoEndpoint, requestBody);
            return res.status(200).json(result.data);
        } catch (error) {
            return res.status(500).json({ 
                message: "Lỗi hệ thống", 
                error: error.message 
            });
        }
    }

    static async updatePremiumStatus(req, res) {
        try {
            const { 
                userId, 
                transactionId, 
                amount, 
                orderInfo, 
                orderId 
            } = req.body;
    
            if (!userId || !transactionId) {
                return res.status(400).json({ message: 'Thiếu thông tin yêu cầu' });
            }
    
            const premiumPlans = {
                '50000': 30,
                '150000': 90,
                '500000': 365
            };
    
            const durationDays = premiumPlans[amount] || 30;
    
            const now = Date.now();
            const expiry = now + durationDays * 24 * 60 * 60 * 1000;
    
            await database.ref(`users/${userId}/premium`).set({
                isPremium: true,
                premiumStart: now,
                premiumExpiry: expiry,
                transactionId,
                orderId,
                amount,
                orderInfo
            });
    
            await database.ref(`transactions/${userId}/${transactionId}`).set({
                type: 'premium_purchase',
                amount,
                date: now,
                orderId,
                orderInfo,
                status: 'success'
            });
    
            return res.status(200).json({ 
                message: 'Kích hoạt premium thành công',
                premiumExpiry: expiry
            });
        } catch (error) {
            console.error('Lỗi kích hoạt premium:', error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }
    

    static async callback(req, res) {
        try {
            const { orderId, resultCode, extraData, amount, orderInfo, transId } = req.body;
    
            if (resultCode !== 0) {
                return res.status(400).json({ message: 'Giao dịch không thành công' });
            }
    
            const userData = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
            const userId = userData.userId;
    
            await MomoPayment.updatePremiumStatus({
                body: {
                    userId,
                    transactionId: transId,
                    amount,
                    orderInfo,
                    orderId
                }
            }, res);
    
            return res.status(200).json({ message: 'Cập nhật premium thành công' });
        } catch (error) {
            return res.status(500).json({ 
                message: 'Lỗi xử lý callback', 
                error: error.message 
            });
        }
    }
    
}

module.exports = MomoPayment;
