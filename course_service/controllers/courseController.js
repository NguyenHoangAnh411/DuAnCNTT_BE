const { admin, database } = require('../../services/firebaseService');

class CourseController {
    static async getAllCourses(req, res) {
        try {
            const coursesRef = database.ref('/courses');
            const snapshot = await coursesRef.once('value');
            const courses = snapshot.val();

            if (!courses) {
                return res.status(404).json({ message: 'No courses found' });
            }

            const coursesList = Object.keys(courses).map(key => ({
                id: key,
                ...courses[key]
            }));

            res.status(200).json(coursesList);
        } catch (error) {
            console.error('Error fetching courses:', error);
            res.status(500).json({ message: 'Error fetching courses', error: error.message });
        }
    }

    static async getCourseById(req, res) {
        const { courseId } = req.params;

        try {
            const courseRef = database.ref(`/courses/${courseId}`);
            const snapshot = await courseRef.once('value');
            const course = snapshot.val();

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            res.status(200).json({ id: courseId, ...course });
        } catch (error) {
            console.error('Error fetching course:', error);
            res.status(500).json({ message: 'Error fetching course', error: error.message });
        }
    }

    static async searchCourses(req, res) {
        const { query } = req.query;

        try {
            const coursesRef = database.ref('/courses');
            const snapshot = await coursesRef.once('value');
            const courses = snapshot.val();

            if (!courses) {
                return res.status(404).json({ message: 'No courses found' });
            }

            const filteredCourses = Object.keys(courses)
                .filter(key => 
                    courses[key].title.toLowerCase().includes(query.toLowerCase())
                )
                .map(key => ({
                    id: key,
                    ...courses[key]
                }));

            res.status(200).json(filteredCourses);
        } catch (error) {
            console.error('Error searching courses:', error);
            res.status(500).json({ message: 'Error searching courses', error: error.message });
        }
    }
}

module.exports = CourseController;
