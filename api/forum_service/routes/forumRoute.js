const express = require('express');
const ForumController = require('../controllers/forumController');
const { upload } = require('../../services/firebaseService');
const router = express.Router();

router.post('/create-post', ForumController.createPost);
router.post('/upload-image', upload.single('image'), ForumController.uploadImage);

router.post('/like', ForumController.likePost);

router.post('/unlike', ForumController.unlikePost);

router.post('/comment', ForumController.addComment);

router.get('/:postId/comments', ForumController.getComments);

router.get('/', ForumController.getPosts);

router.get('/user/:userId', ForumController.getPostByUserId);

router.put('/:id', ForumController.updatePost);

router.delete('/:id', ForumController.deletePost);

module.exports = router;