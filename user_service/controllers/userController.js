const { admin, database } = require('../../services/firebaseService');
const { uploadImageToFirebase } = require('../../services/firebaseService');


class UserController {
    static async searchUsers(req, res) {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                message: 'Search query is required',
            });
        }

        try {
            const usersSnapshot = await admin.database()
                .ref('users')
                .once('value');

            const users = usersSnapshot.val();
            if (!users) {
                return res.status(404).json({
                    message: 'No users found',
                });
            }

            const filteredUsers = Object.keys(users).reduce((result, userId) => {
                const user = users[userId];
                if (user.displayName && user.displayName.toLowerCase().includes(query.toLowerCase())) {
                    result[userId] = user;
                }
                return result;
            }, {});

            if (Object.keys(filteredUsers).length === 0) {
                return res.status(404).json({
                    message: 'No matching users found',
                });
            }

            res.status(200).json(filteredUsers);
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                message: 'Failed to search users',
                error: error.message,
            });
        }
    }

    static async getUserProfile(req, res) {
        const { userId } = req.params;

        try {
            const userSnapshot = await admin.database()
                .ref(`users/${userId}`)
                .once('value');
    
            const user = userSnapshot.val();
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                });
            }

            const { password, ...safeUserData } = user;
    
            res.status(200).json(safeUserData);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                message: 'Failed to fetch user profile',
                error: error.message,
            });
        }
    }

    static async updateUserProfile(req, res) {
        const userId = req.user.uid;
        const { displayName, username } = req.body;

        console.log('Received displayName:', displayName);
        console.log('Received username:', username);
    
        if (!displayName && !username) {
            return res.status(400).json({ 
                message: 'Ít nhất một trường (displayName hoặc username) phải được cung cấp' 
            });
        }
    
        try {
            const userRef = admin.database().ref(`users/${userId}`);
            const updateData = {
                ...(displayName && { displayName }),
                ...(username && { username }),
                updatedAt: admin.database.ServerValue.TIMESTAMP,
            };
    
            await userRef.update(updateData);
    
            res.status(200).json({ 
                message: 'Cập nhật thông tin thành công',
                data: updateData,
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin:', error);
            res.status(500).json({ 
                message: 'Cập nhật thông tin thất bại', 
                error: error.message 
            });
        }
    }

    static async uploadAvatar(req, res) {
        const userId = req.user.uid;
        const avatarFile = req.file;

        try {
            if (!avatarFile) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No avatar file uploaded' 
                });
            }

            const { url } = await uploadImageToFirebase(avatarFile);

            const userRef = admin.database().ref(`users/${userId}`);
            await userRef.update({ 
                photoUrl: url,
                updatedAt: admin.database.ServerValue.TIMESTAMP
            });

            res.status(200).json({ 
                success: true,
                message: 'Avatar uploaded successfully',
                photoUrl: url,
            });
        } catch (error) {
            console.error('Upload avatar error:', error);

            if (error.message.includes('File size limit')) {
                return res.status(400).json({ 
                    success: false,
                    message: 'File size exceeds 5MB limit' 
                });
            }

            res.status(500).json({ 
                success: false,
                message: 'Failed to upload avatar', 
                error: error.message 
            });
        }
    }
    
  static async logout(req, res) {
    const userId = req.user.uid;

    try {
        await admin.database().ref(`users/${userId}/fcmToken`).remove();

        res.status(200).json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Failed to logout',
            error: error.message
        });
    }
  }

  static async listUsers(req, res) {
    try {
        const usersSnapshot = await admin.database()
            .ref('users')
            .once('value');

        const users = usersSnapshot.val();
        if (!users) {
            return res.status(404).json({
                message: 'No users found'
            });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
  }
  
}

module.exports = UserController;