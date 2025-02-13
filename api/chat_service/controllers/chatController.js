const { database } = require('../../services/firebaseService');
const Group = require('../models/Group');
const Message = require('../models/Message');

class ChatController {
  static async createGroup(req, res) {
    const { name, createdBy, members } = req.body;

    try {
      const creatorRef = database.ref(`users/${createdBy}`);
      const creatorSnapshot = await creatorRef.once('value');
      if (!creatorSnapshot.exists()) {
        return res.status(404).json({ message: 'Creator not found' });
      }

      const membersPromises = members.map(async (memberId) => {
        const memberRef = database.ref(`users/${memberId}`);
        const memberSnapshot = await memberRef.once('value');
        return memberSnapshot.exists();
      });

      const membersExist = await Promise.all(membersPromises);
      if (membersExist.includes(false)) {
        return res.status(404).json({ message: 'One or more members not found' });
      }

      const group = new Group({
        name,
        createdBy,
        members,
        createdAt: Date.now(),
      });

      await group.save();
      res.status(201).json({ message: 'Group created successfully', group });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create group', details: err.message });
    }
  }

  static async sendMessage(req, res) {
    const { groupId, senderId, content } = req.body;

    try {
      const senderRef = database.ref(`users/${senderId}`);
      const senderSnapshot = await senderRef.once('value');
      if (!senderSnapshot.exists()) {
        return res.status(404).json({ message: 'Sender not found' });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.includes(senderId)) {
        return res.status(403).json({ message: 'Sender is not a member of the group' });
      }

      const message = new Message({
        group: groupId,
        sender: senderId,
        content,
        timestamp: Date.now(),
      });

      await message.save();

      const senderData = senderSnapshot.val();
      req.app.get('socketio').to(groupId).emit('newMessage', {
        ...message.toObject(),
        sender: {
          displayName: senderData?.displayName || 'Unknown',
          photoUrl: senderData?.photoUrl || null,
          id: senderId,
        },
      });

      res.status(201).json({ message: 'Message sent successfully', message });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send message', details: err.message });
    }
  }

  static async markMessagesAsRead(req, res) {
    const { groupId, userId } = req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      if (!group.members.includes(userId)) {
        return res.status(403).json({ message: 'User is not a member of the group' });
      }

      const messages = await Message.find({ group: groupId, readBy: { $ne: userId } });

      for (const message of messages) {
        message.readBy.push(userId);
        await message.save();
      }

      req.app.get('socketio').to(groupId).emit('messagesRead', {
        userId,
        groupId,
      });

      res.status(200).json({ message: 'Messages marked as read successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to mark messages as read', details: err.message });
    }
  }

  static async getUnreadMessageCount(req, res) {
    try {
      const { groupId, userId } = req.query;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      const unreadCount = await Message.countDocuments({
        group: groupId,
        readBy: { $ne: userId },
      });
  
      res.status(200).json({ unreadCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch unread message count', error });
    }
  }

  static async getGroupMessages(req, res) {
    const { groupId } = req.params;
    const { userId } = req.query;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const messages = await Message.find({ group: groupId }).sort({ timestamp: 1 });

      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const senderId = message.sender;
          const senderRef = database.ref(`users/${senderId}`);
          const senderSnapshot = await senderRef.once('value');
          const senderData = senderSnapshot.val();

          return {
            ...message.toObject(),
            sender: {
              displayName: senderData?.displayName || 'Unknown',
              photoUrl: senderData?.photoUrl || null,
              id: senderId,
            },
            isRead: message.readBy.includes(userId),
          };
        })
      );

      res.status(200).json(messagesWithSenders);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
    }
  }

  static async addUserToGroup(req, res) {
    const { groupId } = req.params;
    const { userId } = req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const userRef = database.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      if (!userSnapshot.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (group.members.includes(userId)) {
        return res.status(400).json({ message: 'User is already in the group' });
      }

      group.members.push(userId);
      await group.save();

      const userData = userSnapshot.val();
      req.app.get('socketio').to(groupId).emit('newMember', {
        userId,
        displayName: userData?.displayName || 'Unknown',
        photoUrl: userData?.photoUrl || null,
      });

      res.status(200).json({ message: 'User added to the group successfully', group });
    } catch (err) {
      res.status(500).json({ error: 'Failed to invite user to group', details: err.message });
    }
  }

  static async getUserGroups(req, res) {
    const { userId } = req.params;

    try {
      const userRef = database.ref(`users/${userId}`);
      const userSnapshot = await userRef.once('value');
      if (!userSnapshot.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }

      const groups = await Group.find({ members: userId });

      const groupsWithLastMessage = await Promise.all(
        groups.map(async (group) => {
          const lastMessage = await Message.findOne({ group: group._id })
            .sort({ timestamp: -1 })
            .limit(1);

          let senderDisplayName = null;
          if (lastMessage && lastMessage.sender) {
            const senderRef = database.ref(`users/${lastMessage.sender}`);
            const senderSnapshot = await senderRef.once('value');
            if (senderSnapshot.exists()) {
              const senderData = senderSnapshot.val();
              senderDisplayName = senderData.displayName;
            }
          }

          return {
            ...group.toObject(),
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              sender: senderDisplayName,
              timestamp: lastMessage.timestamp,
            } : null,
          };
        })
      );

      res.status(200).json(groupsWithLastMessage);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user groups', details: err.message });
    }
  }
}

module.exports = ChatController;