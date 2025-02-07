const { admin, database } = require('../../services/firebaseService');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.Admin_Email,
      pass: 'qtnp mtzy ukvq mklr',
    },
});

const bcrypt = require('bcryptjs');
class AuthController {
    static async register(req, res) {
        const { email, password, username, displayName } = req.body;
      
        try {
          const hashedPassword = await bcrypt.hash(password, 10);

          const existingUserSnapshot = await admin.database()
            .ref('users')
            .orderByChild('email')
            .equalTo(email)
            .once('value');
      
          if (existingUserSnapshot.exists()) {
            return res.status(400).json({ 
              message: 'Email already exists' 
            });
          }

          const verificationCode = Math.floor(100000 + Math.random() * 900000);

          const newUserRef = admin.database().ref('users').push();
      
          await newUserRef.set({
            email: email,
            username: username,
            displayName: displayName,
            password: hashedPassword,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            role: 'user',
            verificationCode: verificationCode,
            isVerified: false,
          });

          const mailOptions = {
            from: process.env.Admin_Email,
            to: email,
            subject: 'Xác thực email của bạn',
            text: `Xin chào,\n\nMã xác thực của bạn là: ${verificationCode}\n\nVui lòng nhập mã này để hoàn tất quá trình đăng ký.\n\nCảm ơn!`,
            html: `<p>Xin chào,</p><p>Mã xác thực của bạn là: <strong>${verificationCode}</strong></p><p>Vui lòng nhập mã này để hoàn tất quá trình đăng ký.</p><p>Cảm ơn!</p>`,
          };
      
          await transporter.sendMail(mailOptions);
      
          res.status(201).json({ 
            message: 'User registered successfully. Please check your email for verification code.',
          });
        } catch (error) {
          console.error('Registration error:', error);
          res.status(500).json({ 
            message: 'Registration failed', 
            error: error.message 
          });
        }
      }
      

      static async verifyEmail(req, res) {
        const { email, verificationCode } = req.body;
      
        try {
          const userSnapshot = await admin.database()
            .ref('users')
            .orderByChild('email')
            .equalTo(email)
            .once('value');
      
          const users = userSnapshot.val();

          if (!users) {
            return res.status(404).json({ 
              message: 'Người dùng không tồn tại' 
            });
          }

          const userId = Object.keys(users)[0];
          const user = users[userId];

          console.log(userId)
          if (user.verificationCode !== parseInt(verificationCode)) {
            return res.status(400).json({ 
              message: 'Mã xác thực không đúng' 
            });
          }

          await admin.database().ref(`users/${userId}`).update({
            isVerified: true,
          });
      
          res.status(200).json({ 
            message: 'Xác thực email thành công' 
          });
        } catch (error) {
          console.error('Lỗi xác thực:', error);
          res.status(500).json({ 
            message: 'Xác thực thất bại', 
            error: error.message 
          });
        }
      }


      static async forgotPassword(req, res) {
        const { email } = req.body;
    
        try {
            const userSnapshot = await admin.database()
                .ref('users')
                .orderByChild('email')
                .equalTo(email)
                .once('value');
    
            const users = userSnapshot.val();
            if (!users) {
                return res.status(404).json({
                    message: 'Email not found'
                });
            }
  
            const userId = Object.keys(users)[0];
  
            const resetToken = Math.random().toString(36).substr(2, 12);
  
            await admin.database().ref(`users/${userId}`).update({
                resetPasswordToken: resetToken,
                resetPasswordExpires: Date.now() + 3600000
            });
  
            const mailOptions = {
                from: process.env.Admin_Email,
                to: email,
                subject: 'Password Reset',
                text: `You requested a password reset. Here is your token: ${resetToken}. It will expire in 1 hour.`,
                html: `<p>You requested a password reset. Here is your token: <strong>${resetToken}</strong>. It will expire in 1 hour.</p>`
            };
    
            await transporter.sendMail(mailOptions);
    
            res.status(200).json({
                message: 'Password reset token sent to email'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                message: 'Failed to process forgot password',
                error: error.message
            });
        }
    }
  
    static async requestResetPassword(req, res) {
      const { email } = req.body;
  
      try {
          const userSnapshot = await admin.database()
              .ref('users')
              .orderByChild('email')
              .equalTo(email)
              .once('value');
  
          const users = userSnapshot.val();
          if (!users) {
              return res.status(404).json({
                  message: 'Email không tồn tại'
              });
          }
  
          const userId = Object.keys(users)[0];

          const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

          await admin.database().ref(`users/${userId}`).update({
              resetPasswordCode: resetCode,
              resetPasswordExpires: Date.now() + 15 * 60 * 1000
          });

          const mailOptions = {
              from: process.env.Admin_Email,
              to: email,
              subject: 'Mã xác thực đặt lại mật khẩu',
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2>Đặt lại mật khẩu</h2>
                      <p>Mã xác thực của bạn là:</p>
                      <h3 style="background-color: #f4f4f4; padding: 10px; text-align: center;">${resetCode}</h3>
                      <p>Mã này sẽ hết hạn sau 15 phút.</p>
                      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                  </div>
              `
          };

          await transporter.sendMail(mailOptions);
  
          res.status(200).json({
              message: 'Mã xác thực đã được gửi đến email của bạn'
          });
  
      } catch (error) {
          console.error('Lỗi yêu cầu đặt lại mật khẩu:', error);
          res.status(500).json({
              message: 'Không thể xử lý yêu cầu đặt lại mật khẩu',
              error: error.message
          });
      }
  }
  
  static async verifyResetPasswordCode(req, res) {
      const { email, resetCode } = req.body;
  
      try {
          const userSnapshot = await admin.database()
              .ref('users')
              .orderByChild('email')
              .equalTo(email)
              .once('value');
  
          const users = userSnapshot.val();
          if (!users) {
              return res.status(404).json({
                  message: 'Email không tồn tại'
              });
          }
  
          const userId = Object.keys(users)[0];
          const user = users[userId];

          if (!user.resetPasswordCode || 
              user.resetPasswordCode !== resetCode || 
              Date.now() > user.resetPasswordExpires) {
              return res.status(400).json({
                  message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
              });
          }

          await admin.database().ref(`users/${userId}`).update({
              resetPasswordCode: null,
              resetPasswordExpires: null
          });
  
          res.status(200).json({
              message: 'Mã xác thực hợp lệ',
              userId: userId
          });
  
      } catch (error) {
          console.error('Lỗi xác thực mã đặt lại mật khẩu:', error);
          res.status(500).json({
              message: 'Không thể xác thực mã đặt lại mật khẩu',
              error: error.message
          });
      }
  }
  
  static async resetPassword(req, res) {
      const { userId, newPassword } = req.body;
  
      try {
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          await admin.database().ref(`users/${userId}`).update({
              password: hashedPassword,
              resetPasswordCode: null,
              resetPasswordExpires: null
          });
  
          res.status(200).json({
              message: 'Mật khẩu đã được đặt lại thành công'
          });
  
      } catch (error) {
          console.error('Lỗi đặt lại mật khẩu:', error);
          res.status(500).json({
              message: 'Không thể đặt lại mật khẩu',
              error: error.message
          });
      }
    }

    static async changePassword(req, res) {
        const userId = req.user.uid;
        const { oldPassword, newPassword } = req.body;
    
        try {
            const userSnapshot = await admin.database()
                .ref(`users/${userId}`)
                .once('value');
    
            const user = userSnapshot.val();
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: 'Old password is incorrect'
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await admin.database().ref(`users/${userId}`).update({
                password: hashedPassword
            });
    
            res.status(200).json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                message: 'Failed to change password',
                error: error.message
            });
        }
      }
}

module.exports = AuthController;