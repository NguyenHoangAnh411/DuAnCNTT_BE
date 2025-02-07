const { admin, database } = require('../../services/firebaseService');
class AttendanceController {
    static async checkIn(req, res) {
        const { uid } = req.body;
        const today = new Date().toISOString().split('T')[0];
    
        if (!uid) {
            return res.status(400).send('Thiếu thông tin người dùng.');
        }
    
        try {
            const attendanceRef = database.ref(`attendance/${uid}`);
            const attendanceSnapshot = await attendanceRef.once('value');
            const attendanceData = attendanceSnapshot.val() || {};

            if (attendanceData[today]) {
                return res.status(400).json({ message: 'Bạn đã điểm danh hôm nay!' });
            }

            const lastCheckIn = attendanceData.lastCheckIn || null;
            const streak = lastCheckIn === getYesterday(today)
                ? (attendanceData.streak || 0) + 1
                : 1;

            await attendanceRef.update({
                [today]: true,
                streak,
                lastCheckIn: today
            });

            res.status(200).json({
                message: 'Điểm danh thành công!',
                streak
            });
        } catch (error) {
            console.error('Check-in error:', error);
            res.status(500).json({ message: 'Điểm danh thất bại.', error: error.message });
        }
    }

    static async getAttendanceHistory(req, res) {
        const { uid } = req.params;

        if (!uid) {
            return res.status(400).send('Thiếu thông tin người dùng.');
        }

        try {
            const attendanceRef = admin.database().ref(`attendance/${uid}`);
            const attendanceSnapshot = await attendanceRef.once('value');
            const attendanceData = attendanceSnapshot.val();

            if (!attendanceData) {
                return res.status(404).json({ message: 'Không tìm thấy lịch sử điểm danh.' });
            }

            res.status(200).json(attendanceData);
        } catch (error) {
            console.error('Get attendance history error:', error);
            res.status(500).json({ message: 'Không lấy được lịch sử điểm danh.', error: error.message });
        }
    }


}
function getYesterday(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}
module.exports = AttendanceController;