const axios = require('axios');
const crypto = require('crypto');

const accessKey = 'F8BBA842ECF85';
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const partnerCode = 'MOMO';

const redirectUrl = 'https://yourdomain.com/redirect-page';
const ipnUrl = 'https://yourdomain.com/momo-ipn';

class momoPayment {
    static async momoPayment(req, res) {
        try {
            // Các tham số có thể lấy từ body hoặc tự định nghĩa
            const orderInfo = 'pay with MoMo';
            const requestType = "payWithMethod";
            const amount = '50000'; // Số tiền thanh toán (đơn vị: VND)
            const orderId = partnerCode + new Date().getTime();
            const requestId = orderId;
            const extraData = ''; // Dữ liệu bổ sung (nếu có)
            const orderGroupId = '';
            const autoCapture = true;
            const lang = 'vi';
        
            // Tạo raw signature theo định dạng của MoMo
            const rawSignature = 
              "accessKey=" + accessKey +
              "&amount=" + amount +
              "&extraData=" + extraData +
              "&ipnUrl=" + ipnUrl +
              "&orderId=" + orderId +
              "&orderInfo=" + orderInfo +
              "&partnerCode=" + partnerCode +
              "&redirectUrl=" + redirectUrl +
              "&requestId=" + requestId +
              "&requestType=" + requestType;
        
            // Tính chữ ký (HMAC SHA256)
            const signature = crypto.createHmac('sha256', secretKey)
                                    .update(rawSignature)
                                    .digest('hex');
        
            // Tạo payload cho API của MoMo
            const requestBody = {
              partnerCode: partnerCode,
              partnerName: "Zap",               // Tên đối tác (theo cấu hình)
              storeId: "MomoTestStore",         // Mã cửa hàng (nếu có)
              requestId: requestId,
              amount: amount,
              orderId: orderId,
              orderInfo: orderInfo,
              redirectUrl: redirectUrl,
              ipnUrl: ipnUrl,
              lang: lang,
              requestType: requestType,
              autoCapture: autoCapture,
              extraData: extraData,
              orderGroupId: orderGroupId,
              signature: signature
            };
        
            // Gọi API tạo giao dịch của MoMo
            const options = {
              method: "POST",
              url: "https://test-payment.momo.vn/v2/gateway/api/create", // URL test của MoMo; thay đổi nếu dùng production
              headers: {
                'Content-Type': 'application/json'
              },
              data: requestBody
            };
        
            const result = await axios(options);
        
            // Trả về dữ liệu của MoMo (chẳng hạn như link thanh toán)
            return res.status(200).json(result.data);
          } catch (error) {
            console.error('Error calling MoMo API:', error.response ? error.response.data : error.message);
            return res.status(500).json({
              statusCode: 500,
              message: "Server error",
              error: error.response ? error.response.data : error.message
            });
          }
    }

    static async callBack(req, res) {
        // Lấy dữ liệu callback từ MoMo
        const data = req.body;
        console.log('Nhận được callback từ MoMo:', data);

        /**
         * Dữ liệu callback từ MoMo thường có cấu trúc như sau (tham khảo tài liệu của MoMo):
         * {
         *   "partnerCode": "MOMO",
         *   "accessKey": "F8BBA842ECF85",
         *   "requestId": "MOMO1617972053",
         *   "orderId": "MOMO1617972053",
         *   "amount": "50000",
         *   "orderInfo": "pay with MoMo",
         *   "orderType": "payWithMethod",
         *   "transId": "123456789",
         *   "resultCode": 0,            // 0: thành công; khác 0: thất bại
         *   "message": "Success",
         *   "payType": "momo_wallet",
         *   "responseTime": 1617972070,
         *   "extraData": "",
         *   "signature": "..."
         * }
         *
         * Lưu ý: thứ tự tham số khi tạo raw signature phải theo đúng yêu cầu của MoMo.
         */
        
        // Xây dựng raw signature từ các tham số nhận được
        const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData || ''}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;

        // Tính chữ ký từ callback
        const computedSignature = crypto.createHmac('sha256', secretKey)
                                        .update(rawSignature)
                                        .digest('hex');

        // Kiểm tra tính hợp lệ của chữ ký
        if (computedSignature !== data.signature) {
            console.error('Chữ ký callback không hợp lệ!');
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Kiểm tra kết quả giao dịch
        if (parseInt(data.resultCode) === 0) {
            console.log('Thanh toán MoMo thành công cho orderId:', data.orderId);
            // TODO: Cập nhật trạng thái đơn hàng trong database, gửi email xác nhận, vv.
        } else {
            console.error('Thanh toán thất bại hoặc có lỗi:', data.message);
            // TODO: Xử lý trường hợp giao dịch thất bại (cập nhật trạng thái đơn hàng, thông báo cho khách hàng, vv.)
        }

        // Trả về HTTP 200 để xác nhận đã nhận callback từ MoMo
        return res.status(200).json({ message: "IPN Received" });
    }
}

module.exports = momoPayment;