const { admin, database } = require('../../services/firebaseService');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

async function generateHashedPassword(length = 10) {
  const password = generateRandomPassword(length);
  const hashedPassword = await bcrypt.hash(password, 10);
  return { password, hashedPassword };
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.Admin_Email,
    pass: 'qtnp mtzy ukvq mklr',
  },
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.Admin_Email,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
}

class AdminUserController {
  static async listUsers(req, res) {
    try {
      const usersSnapshot = await admin.database().ref('users').once('value');
      const users = usersSnapshot.val();
      if (!users) {
        return res.status(404).json({
          message: 'No users found',
        });
      }
      res.status(200).json(users);
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({
        message: 'Failed to fetch users',
        error: error.message,
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userRef = database.ref(`users/${id}`);
      const snapshot = await userRef.once('value');
      const user = snapshot.val();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user', error });
    }
  }

  static async createUser(req, res) {
    try {
      const { displayName, email, photoUrl, role } = req.body;
  
      if (!displayName || !email) {
        return res.status(400).json({
          message: 'Missing required fields: displayName and email are required',
        });
      }

      const { password, hashedPassword } = await generateHashedPassword();

      const userRecord = await admin.auth().createUser({
        email,
        password: hashedPassword,
        displayName,
        photoURL: photoUrl || 'https://via.placeholder.com/150',
      });

      const userData = {
        uid: userRecord.uid,
        displayName,
        email,
        password: hashedPassword,
        photoUrl: photoUrl || 'https://via.placeholder.com/150',
        role: role || 'user',
        isVerified: true,
        createdAt: Date.now(),
      };
  
      await database.ref(`users/${userRecord.uid}`).set(userData);

      await sendEmail(email, 'Your Temporary Password', `Your temporary password is: ${password}`);
  
      res.status(201).json(userData);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        message: 'Failed to create user',
        error: error.message,
      });
    }
  }

  // Cập nhật thông tin người dùng
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { displayName, email, photoUrl, role } = req.body;

      const userRef = database.ref(`users/${id}`);
      const snapshot = await userRef.once('value');
      const user = snapshot.val();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = {};

      if (displayName !== undefined) updates.displayName = displayName;
      if (email !== undefined) updates.email = email;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;
      if (role !== undefined) updates.role = role;

      updates.updatedAt = Date.now();

      await userRef.update(updates);

      const updatedUser = { ...user, ...updates };
      res.status(200).json({ id, ...updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  }

  // Xóa người dùng
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const userRef = admin.database().ref(`users/${id}`);
      const snapshot = await userRef.once('value');
      const user = snapshot.val();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await userRef.remove();

      await admin.auth().deleteUser(id);

      const postsRef = admin.database().ref('posts');
      const postsSnapshot = await postsRef.orderByChild('userId').equalTo(id).once('value');
      const posts = postsSnapshot.val();

      if (posts) {
        const updates = {};
        Object.keys(posts).forEach((postId) => {
          updates[`posts/${postId}`] = null;
        });
        await admin.database().ref().update(updates);
      }

      res.status(200).json({ message: 'User and all related data deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  }

  // Bật/tắt trạng thái xác minh của người dùng
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const userRef = database.ref(`users/${id}`);
      const snapshot = await userRef.once('value');
      const user = snapshot.val();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await userRef.update({ isVerified: !user.isVerified });
      res.status(200).json({ id, isVerified: !user.isVerified });
    } catch (error) {
      res.status(500).json({ message: 'Failed to toggle user status', error });
    }
  }

  // Cập nhật vai trò của người dùng
  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const userRef = database.ref(`users/${id}`);
      const snapshot = await userRef.once('value');
      const user = snapshot.val();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      await userRef.update({ role });
      res.status(200).json({ id, role });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user role', error });
    }
  }
}

module.exports = AdminUserController;