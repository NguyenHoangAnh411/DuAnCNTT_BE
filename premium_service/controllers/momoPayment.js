const axios = require('axios');
const crypto = require('crypto');

class momoPayment {
    static async momoPayment(req, res) {
        // có thể tự thêm body
        var accessKey = 'F8BBA842ECF85';
        var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        var orderInfo = 'pay with MoMo';
        var partnerCode = 'MOMO';
        var redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'; // thanh toán xong nó chuyển về
        var ipnUrl = 'http://localhost:3014/api/premium/payment/callback';
        var requestType = "payWithMethod";
        var amount = '50000'; // số tiền mặc định
        var orderId = partnerCode + new Date().getTime();
        var requestId = orderId;
        var extraData ='';
        var orderGroupId ='';
        var autoCapture =true;
        var lang = 'vi';

        var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;

        var signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode : partnerCode,
            partnerName : "Zap",
            storeId : "MomoTestStore",
            requestId : requestId,
            amount : amount,
            orderId : orderId,
            orderInfo : orderInfo,
            redirectUrl : redirectUrl,
            ipnUrl : ipnUrl,
            lang : lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData : extraData,
            orderGroupId: orderGroupId,
            signature : signature
        });

        const options = {
            method: "POST",
            url: "https://test-payment.momo.vn/v2/gateway/api/create",
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            data: requestBody
        }

        try {
            const result = await axios(options);
            return res.status(200).json(result.data);
        } catch (error) {
            console.error('Error calling MoMo API:', error.response ? error.response.data : error.message);
            return res.status(500).json({
                statusCode: 500,
                message: "server error",
                error: error.response ? error.response.data : error.message
            });
        }
    }

    static async Callback(req, res) {
        console.log("Call back: ")
        console.log(req.body);

        return res.status(200).json(req.body)
    }
}

module.exports = momoPayment;