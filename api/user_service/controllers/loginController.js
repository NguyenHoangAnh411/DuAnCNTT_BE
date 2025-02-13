const { admin, database } = require('../../services/firebaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class LoginController {
    static async login(req, res) {
        const { email, password, fcmToken } = req.body;
      
        try {
            const userSnapshot = await admin.database()
                .ref('users')
                .orderByChild('email')
                .equalTo(email)
                .once('value');
      
            const users = userSnapshot.val();
      
            if (!users) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
      
            const userId = Object.keys(users)[0];
            const user = users[userId];

            if (!user.password) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            if (fcmToken) {
                await admin.database().ref(`users/${userId}/fcmToken`).set(fcmToken);
            }

            const token = jwt.sign(
                {
                    uid: userId,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                },
                // process.env.JWT_SECRET,
                'HoangAnhDepTrai',
                { expiresIn: '1h' }
            );
      
            res.status(200).json({
                token: token,
                uid: userId,
                email: user.email,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
            });
      
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Login failed', error: error.message });
        }
    }

    static async saveUserInfo(req, res) {
        const { uid, displayName, email, photoUrl, userType, role, fcmToken } = req.body;

        if (!uid || !displayName || !email) {
            return res.status(400).send('Thiếu thông tin người dùng');
        }

        try {
            await admin.database().ref('users/' + uid).set({
                displayName,
                email,
                photoUrl,
                userType,
                role,
                fcmToken
            });

            res.status(200).send('Thông tin người dùng đã được lưu thành công');
        } catch (error) {
            res.status(500).send('Lỗi khi lưu thông tin người dùng: ' + error.message);
        }
    }

    static async getUserRole(req, res) {
        const { uid } = req.params;

        if (!uid) {
            return res.status(400).json({ message: 'Thiếu thông tin uid' });
        }

        try {
            const userSnapshot = await admin.database()
                .ref('users/' + uid)
                .once('value');

            const user = userSnapshot.val();

            if (!user) {
                return res.status(404).json({ message: 'Người dùng không tồn tại' });
            }

            res.status(200).json({ role: user.role || 'user' });
        } catch (error) {
            console.error('Lỗi khi lấy thông tin role:', error);
            res.status(500).json({ message: 'Lỗi khi lấy thông tin role', error: error.message });
        }
    }
}

module.exports = LoginController;
