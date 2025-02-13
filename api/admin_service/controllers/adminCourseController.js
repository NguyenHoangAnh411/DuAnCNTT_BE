const { admin, database } = require('../../services/firebaseService');

class AdminCourseController {
  static async getAllCourses(req, res) {
    try {
      const coursesRef = database.ref('courses');
      const snapshot = await coursesRef.once('value');
      const courses = [];
      snapshot.forEach((childSnapshot) => {
        courses.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      res.status(200).json(courses);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      res.status(500).send('Lỗi server');
    }
  }

  static async addCourse(req, res) {
    try {
      const {
        title,
        language,
        level,
        status,
        instructor,
        enrolledStudents,
        category,
        description,
        duration,
        price,
        lessons,
      } = req.body;
  
      const newCourse = {
        title,
        language,
        level,
        status,
        instructor,
        enrolledStudents: enrolledStudents || 0,
        category,
        description: description || 'Không có mô tả',
        duration: duration || 'Không có thời lượng',
        price: price || 'Không có giá',
        lessons: lessons || [],
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };
  
      const courseRef = database.ref('courses').push();
      await courseRef.set(newCourse);
  
      res.status(201).json({ id: courseRef.key, ...newCourse });
    } catch (error) {
      console.error('Lỗi khi thêm khóa học:', error);
      res.status(500).send('Lỗi server');
    }
  }

  static async updateCourse(req, res) {
    try {
      const courseId = req.params.id;
      const {
        title,
        language,
        level,
        status,
        instructor,
        enrolledStudents,
        category,
        description,
        duration,
        price,
        lessons,
      } = req.body;

      const updatedCourse = {
        title: title || 'Không có tiêu đề',
        language: language || 'Không có ngôn ngữ',
        level: level || 'Không có cấp độ',
        status: status || 'Không có trạng thái',
        instructor: instructor || 'Không có giảng viên',
        enrolledStudents: enrolledStudents || 0,
        category: category || 'Không có danh mục',
        description: description || 'Không có mô tả',
        duration: duration || 'Không có thời lượng',
        price: price || 'Không có giá',
        lessons: lessons || [],
        updatedAt: new Date().toISOString(),
      };

      const courseRef = database.ref(`courses/${courseId}`);
      await courseRef.update(updatedCourse);

      res.status(200).json({ id: courseId, ...updatedCourse });
    } catch (error) {
      console.error('Lỗi khi cập nhật khóa học:', error);
      res.status(500).send('Lỗi server');
    }
  }

  static async deleteCourse(req, res) {
    try {
      const courseId = req.params.id;
      const courseRef = database.ref(`courses/${courseId}`);
      await courseRef.remove();
      res.status(200).json({ message: 'Khóa học đã được xóa thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa khóa học:', error);
      res.status(500).send('Lỗi server');
    }
  }

  static async getCourseDetails(req, res) {
    try {
      const courseId = req.params.id;
      const courseRef = database.ref(`courses/${courseId}`);
      const snapshot = await courseRef.once('value');
      if (!snapshot.exists()) {
        res.status(404).send('Khóa học không tồn tại');
      } else {
        res.status(200).json({ id: courseId, ...snapshot.val() });
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết khóa học:', error);
      res.status(500).send('Lỗi server');
    }
  }
}

module.exports = AdminCourseController;