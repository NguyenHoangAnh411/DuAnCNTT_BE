const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');

router.post('/groups', ChatController.createGroup);

router.post('/messages', ChatController.sendMessage);

router.post('/groups/:groupId/invite', ChatController.addUserToGroup);

router.get('/groups/:groupId/messages', ChatController.getGroupMessages);

router.get('/users/:userId/groups', ChatController.getUserGroups);

router.post('/messages/markAsRead', ChatController.markMessagesAsRead);

router.get('/messages/unreadCount', ChatController.getUnreadMessageCount);
module.exports = router;
