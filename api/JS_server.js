const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/admin', require('./admin_service/server'));
app.use('/chat', require('./chat_service/server'));
app.use('/course', require('./course_service/server'));
app.use('/exercise', require('./exercise_service/server'));
app.use('/forum', require('./forum_service/server'));
app.use('/games', require('./games_service/server'));
app.use('/lesson', require('./lesson_service/server'));
app.use('/personalized', require('./personalized_service/server'));
app.use('/premium', require('./premium_service/server'));
app.use('/user', require('./user_service/server'));
app.use('/vocabulary', require('./vocabulary_service/server'));

app.get('/', (req, res) => {
  res.send('Welcome to DUANCNTT Backend!');
});

module.exports = app;
