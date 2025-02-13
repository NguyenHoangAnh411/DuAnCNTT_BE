const { database } = require('../../services/firebaseService');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');

class MomoPayment {
    
    static generateSignature(rawData, secretKey) {
        return crypto.createHmac('sha256', secretKey)
            .update(rawData)
            .digest('hex');
    }

    static generateOrderId(partnerCode) {
        return `${partnerCode}${Date.now()}`;
    }

    static async createPayment(req, res) {
        try {
            const { 
                amount, 
                orderInfo, 
                userId, 
                type,
                itemId 
            } = req.body;

            if (!amount || !orderInfo || !userId || !type) {
                return res.status(400).json({ 
                    message: 'Thiếu thông tin thanh toán' 
                });
            }

            const orderId = MomoPayment.generateOrderId(config.partnerCode);

            const extraData = Buffer.from(JSON.stringify({ 
                userId, 
                type, 
                itemId 
            })).toString('base64');

            const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${orderId}&requestType=payWithMethod`;
            
            const signature = MomoPayment.generateSignature(rawSignature, config.secretKey);

            const requestBody = {
                partnerCode: config.partnerCode,
                requestId: orderId,
                amount: amount.toString(),
                orderId,
                orderInfo,
                redirectUrl: config.redirectUrl,
                ipnUrl: config.ipnUrl,
                lang: 'vi',
                requestType: "payWithMethod",
                extraData,
                signature
            };

            const result = await axios.post(config.momoEndpoint, requestBody);

            await database.ref(`pending_transactions/${orderId}`).set({
                userId,
                type,
                itemId,
                amount,
                orderInfo,
                status: 'pending',
                createdAt: Date.now()
            });

            return res.status(200).json(result.data);
        } catch (error) {
            console.error('Lỗi tạo thanh toán:', error);
            return res.status(500).json({ 
                message: "Lỗi hệ thống", 
                error: error.message 
            });
        }
    }

    static async processPaymentCallback(req, res) {
        try {
            const { 
                orderId, 
                resultCode, 
                extraData, 
                amount, 
                orderInfo, 
                transId 
            } = req.body;

            if (!orderId || resultCode === undefined || !extraData) {
                console.error('Thiếu thông tin bắt buộc');
                return res.status(400).json({ 
                    message: 'Thiếu thông tin thanh toán',
                    receivedData: req.body 
                });
            }

            if (resultCode !== 0) {
                console.error('Giao dịch không thành công', resultCode);
                return res.status(400).json({ 
                    message: 'Giao dịch không thành công',
                    resultCode: resultCode 
                });
            }

            let paymentData;
            try {
                paymentData = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
            } catch (decodeError) {
                console.error('Lỗi giải mã extraData:', decodeError);
                return res.status(400).json({ 
                    message: 'Không thể giải mã dữ liệu bổ sung',
                    extraData: extraData 
                });
            }
    
            const { userId, type, itemId } = paymentData;

            if (!userId || !type) {
                console.error('Thông tin người dùng hoặc loại thanh toán không hợp lệ');
                return res.status(400).json({ 
                    message: 'Thông tin không hợp lệ',
                    paymentData: paymentData 
                });
            }

            const transactionRef = await database.ref(`pending_transactions/${orderId}`).once('value');
            const pendingTransaction = transactionRef.val();
    
            if (!pendingTransaction) {
                console.error('Không tìm thấy giao dịch chờ xử lý');
                return res.status(400).json({ 
                    message: 'Giao dịch không hợp lệ',
                    orderId: orderId 
                });
            }

            try {
                switch(type) {
                    case 'course':
                        await MomoPayment.handleCoursePurchase(userId, itemId, transId, amount, orderId, orderInfo);
                        break;
                    case 'premium':
                        await MomoPayment.handlePremiumPurchase(userId, transId, amount, orderId, orderInfo);
                        break;
                    default:
                        throw new Error('Loại thanh toán không hỗ trợ: ' + type);
                }
            } catch (handlerError) {
                console.error('Lỗi xử lý thanh toán:', handlerError);
                return res.status(500).json({ 
                    message: 'Lỗi xử lý thanh toán',
                    error: handlerError.message 
                });
            }

            await database.ref(`pending_transactions/${orderId}`).remove();
            await database.ref(`completed_transactions/${orderId}`).set({
                ...pendingTransaction,
                status: 'completed',
                transactionId: transId,
                completedAt: Date.now()
            });
    
            return res.status(200).json({ 
                message: 'Thanh toán thành công',
                type: type 
            });
    
        } catch (error) {
            console.error('Lỗi không mong muốn trong quá trình xử lý callback:', error);
            return res.status(500).json({ 
                message: 'Lỗi hệ thống không mong muốn', 
                error: error.message 
            });
        }
    }
    

    static async handleCoursePurchase(userId, courseId, transId, amount, orderId, orderInfo) {
        const now = Date.now();

        await database.ref(`courses/${courseId}/registors/${userId}`).set({
            registeredAt: now,
            transactionId: transId,
            amount,
            status: 'active'
        });

        await database.ref(`transactions/${userId}/${transId}`).set({
            type: 'course_purchase',
            courseId,
            amount,
            date: now,
            orderId,
            orderInfo,
            status: 'success'
        });
    }

    static async handlePremiumPurchase(userId, transId, amount, orderId, orderInfo) {
        const now = Date.now();

        const premiumPlans = {
            '50000': 30,
            '150000': 90,
            '500000': 365
        };

        const durationDays = premiumPlans[amount] || 30;
        const expiry = now + durationDays * 24 * 60 * 60 * 1000;

        await database.ref(`users/${userId}/premium`).set({
            isPremium: true,
            premiumStart: now,
            premiumExpiry: expiry,
            transactionId: transId,
            orderId,
            amount,
            orderInfo
        });

        await database.ref(`transactions/${userId}/${transId}`).set({
            type: 'premium_purchase',
            amount,
            date: now,
            orderId,
            orderInfo,
            status: 'success'
        });
    }
}

module.exports = MomoPayment;
