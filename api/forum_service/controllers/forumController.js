const { database, uploadPost } = require('../../services/firebaseService');

class ForumController {
    static async createPost(req, res) {
                try {
                    const { userId, content, hashtags, imageUrls } = req.body;

                    if (!userId || !content) {
                        return res.status(400).json({ message: 'Missing required fields: userId and content' });
                    }

                    const newPost = {
                        userId,
                        content,
                        hashtags: hashtags ? hashtags.split(',') : [],
                        timestamp: Date.now(),
                        likes: 0,
                        likedBy: {},
                        comments: [],
                        fileUrls: imageUrls || []
                    };

                    const postRef = database.ref('posts').push();
                    await postRef.set(newPost);

                    res.status(201).json({ id: postRef.key, ...newPost });
                } catch (error) {
                    console.error('Error creating post:', error);
                    res.status(500).json({ message: 'Internal server error' });
                }
            }
            static async uploadImage(req, res) {
                try {
                    const { userId } = req.body;
                    const file = req.file;

                    if (!userId || !file) {
                        return res.status(400).json({ message: 'Missing required fields: userId and image' });
                    }

                    const destinationPath = `posts/${userId}/${Date.now()}_${file.originalname}`;
                    const fileUrl = await uploadPost(file, destinationPath); // Giả sử uploadPost trả về URL của ảnh

                    // Trả về URL ảnh dưới dạng String
                    res.status(201).json(fileUrl); // Thay vì { imageUrl: fileUrl }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    res.status(500).json({ message: 'Internal server error' });
                }
            }



    static async likePost(req, res) {
        try {
            const { postId, userId } = req.body;
    
            if (!postId || !userId) {
                return res.status(400).json({ message: 'Missing required fields: postId and userId' });
            }
    
            const postRef = database.ref(`posts/${postId}`);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
    
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
    
            if (post.likedBy && post.likedBy[userId]) {
                return res.status(400).json({ message: 'User already liked this post' });
            }
    
            const updatedLikes = (post.likes || 0) + 1;
            const updatedLikedBy = { ...post.likedBy, [userId]: true };
    
            await postRef.update({
                likes: updatedLikes,
                likedBy: updatedLikedBy
            });
    
            res.status(200).json({ message: 'Post liked successfully', likes: updatedLikes });
        } catch (error) {
            console.error('Error liking post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    static async unlikePost(req, res) {
        try {
            const { postId, userId } = req.body;
    
            if (!postId || !userId) {
                return res.status(400).json({ message: 'Missing required fields: postId and userId' });
            }
    
            const postRef = database.ref(`posts/${postId}`);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
    
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
    
            if (!post.likedBy || !post.likedBy[userId]) {
                return res.status(400).json({ message: 'User has not liked this post' });
            }
    
            const updatedLikes = (post.likes || 0) - 1;
            const updatedLikedBy = { ...post.likedBy };
            delete updatedLikedBy[userId];
    
            await postRef.update({
                likes: updatedLikes,
                likedBy: updatedLikedBy
            });
    
            res.status(200).json({ message: 'Post unliked successfully', likes: updatedLikes });
        } catch (error) {
            console.error('Error unliking post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async addComment(req, res) {
        try {
            const { postId, userId, content } = req.body;
    
            if (!postId || !userId || !content) {
                return res.status(400).json({ message: 'Missing required fields: postId, userId, and content' });
            }
    
            const newComment = {
                userId,
                content,
                timestamp: Date.now(),
                likes: 0,
                likedBy: {}
            };
    
            const postRef = database.ref(`posts/${postId}`);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
    
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            if (post.comments === undefined || post.comments === null) {
                post.comments = [];
            }

            const updatedComments = [...post.comments, newComment];
            await postRef.update({ comments: updatedComments });
    
            res.status(201).json({ message: 'Comment added successfully', comment: newComment });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getComments(req, res) {
        try {
            const { postId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
    
            if (!postId) {
                return res.status(400).json({ message: 'Missing required field: postId' });
            }

            const postRef = database.ref(`posts/${postId}`);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
    
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
    
            const comments = post.comments || [];
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedComments = comments.slice(startIndex, endIndex);
    
            res.status(200).json({
                comments: paginatedComments,
                total: comments.length,
                page,
                limit
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
    
            const postsRef = database.ref('posts');
            const snapshot = await postsRef.once('value');
    
            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'No posts found' });
            }
    
            const posts = [];
            snapshot.forEach((childSnapshot) => {
                const post = childSnapshot.val();
                posts.push({
                    id: childSnapshot.key,
                    ...post,
                });
            });

            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedPosts = posts.slice(startIndex, endIndex);
    
            res.status(200).json({
                posts: paginatedPosts,
                total: posts.length,
                page,
                limit,
                totalPages: Math.ceil(posts.length / limit)
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getPostByUserId(req, res) {
        try {
            const userId = req.params.userId; // Lấy userId từ request params
    
            // Lấy tất cả các bài viết từ database
            const postsRef = database.ref('posts');
            const snapshot = await postsRef.once('value');
    
            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'No posts found' });
            }
    
            // Lọc các bài viết có userId trùng khớp
            const posts = [];
            snapshot.forEach((childSnapshot) => {
                const post = childSnapshot.val();
                if (post.userId === userId) {
                    posts.push({
                        id: childSnapshot.key, // ID của bài viết
                        ...post, // Thông tin bài viết
                    });
                }
            });
    
            // Trả về danh sách bài viết
            res.status(200).json(posts);
        } catch (error) {
            console.error('Error fetching posts by user ID:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updatePost(req, res) {
        try {
            const postId = req.params.id;
            const { content, file } = req.body;

            const postRef = database.ref(`posts/${postId}`);
            const snapshot = await postRef.once('value');
            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const updatedPost = {
                ...snapshot.val(),
                content: content || snapshot.val().content,
                timestamp: Date.now(),
            };

            if (file) {
                const fileUrl = await uploadPost(file, `posts/${snapshot.val().userId}/${Date.now()}`);
                updatedPost.fileUrl = fileUrl;
            }

            await postRef.update(updatedPost);

            res.status(200).json({ id: postId, ...updatedPost });
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async deletePost(req, res) {
        try {
            const postId = req.params.id;

            const postRef = database.ref(`posts/${postId}`);
            const snapshot = await postRef.once('value');
            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'Post not found' });
            }

            await postRef.remove();

            res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = ForumController;