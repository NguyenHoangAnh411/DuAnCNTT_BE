const { admin, database } = require('../../services/firebaseService');
const schedule = require('node-schedule');
class AdminNotificationController {
  static async getNotificationsByUserId(req, res) {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ message: "Bạn cần đăng nhập" });
      }
  
      const snapshot = await database.ref('notifications').once('value');
  
      if (!snapshot.exists()) {
        return res.status(404).json({ message: "Không tìm thấy thông báo" });
      }
  
      const notifications = snapshot.val();
      const userNotifications = [];
  
      for (let key in notifications) {
        const notification = notifications[key];
        const recipientIds = Object.values(notification.recipientIds);
  
        if (recipientIds.includes(userId)) {
          const { recipientIds, ...notificationWithoutRecipient } = notification;
          userNotifications.push(notificationWithoutRecipient);
        }
      }
  
      if (userNotifications.length > 0) {
        return res.status(200).json(userNotifications);
      } else {
        return res.status(404).json({ message: "Không có thông báo cho người dùng này" });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
    }
  }
  
    static async sendNotification(req, res) {
        try {
          const { title, body, userIds, scheduledTime } = req.body;
      
          if (!title || !body) {
            return res.status(400).json({ message: "Thiếu thông tin tiêu đề hoặc nội dung" });
          }
      
          const snapshot = await database.ref('users').once('value');
          const users = snapshot.val();
      
          if (!users) {
            return res.status(404).json({ message: "Không có người dùng nào trong hệ thống" });
          }
      
          let tokens = [];
          let recipientIds = [];
      
          if (userIds && userIds.length > 0) {
            tokens = userIds.map(userId => users[userId]?.fcmToken).filter(token => token);
            recipientIds = userIds;
          } else {
            tokens = Object.values(users).map(user => user.fcmToken).filter(token => token);
            recipientIds = Object.keys(users);
          }
      
          if (tokens.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy token FCM nào hợp lệ" });
          }
      
          const message = {
            notification: {
              title: title,
              body: body,
            },
          };
      
          if (scheduledTime) {

            const job = schedule.scheduleJob(new Date(scheduledTime), async function() {
              const results = [];
              for (const token of tokens) {
                try {
                  const response = await admin.messaging().send({
                    ...message,
                    token: token,
                  });
                  results.push({ token, success: true, response });
                } catch (error) {
                  results.push({ token, success: false, error: error.message });
                }
              }
      
              const notificationRef = database.ref('notifications').push();
              await notificationRef.set({
                id: notificationRef.key,
                title: title,
                body: body,
                recipientIds: recipientIds,
                timestamp: Date.now(),
              });
      
              console.log("Thông báo đã được gửi theo lịch trình");
            });
      
            return res.status(200).json({
              message: "Thông báo đã được lên lịch và sẽ gửi sau",
            });
          } else {
            const results = [];
            for (const token of tokens) {
              try {
                const response = await admin.messaging().send({
                  ...message,
                  token: token,
                });
                results.push({ token, success: true, response });
              } catch (error) {
                results.push({ token, success: false, error: error.message });
              }
            }
      
            const notificationRef = database.ref('notifications').push();
            await notificationRef.set({
              id: notificationRef.key,
              title: title,
              body: body,
              recipientIds: recipientIds,
              timestamp: Date.now(),
            });
      
            return res.status(200).json({
              message: "Thông báo đã được gửi ngay và lưu vào database",
              results,
            });
          }
        } catch (error) {
          console.error("Lỗi gửi thông báo:", error);
          return res.status(500).json({ message: "Lỗi server", error: error.message });
        }
      }
}

module.exports = AdminNotificationController;
