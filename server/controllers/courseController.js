import Course from "../models/Course.js";

// get all course
export const getAllCourse = async(req,res) => {
    try{
        const courses = await Course.find({isPublished:true}).select(['-courseContent','-enrolledStudents']).populate({path:'educator'})
        res.json({success:true,courses})
    }catch(error){  
        res.json({success:false,message:error.message})
    }
}

// get course by id
export const getCourseId = async (req,res) => {
    const {id} = req.params
    try{
        const courseData = await Course.findById(id).populate({path:'educator'})
        // remove lectureurl if isPreview is false
        courseData.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                if(!lecture.isPreviewFree){
                    lecture.lectureUrl = ''
                }
            })
        })
        res.json({success:true,courseData})

    }catch(error){
        res.json({success:false,message:error.message})
    }
}

// lấy danh sách các user đã đăng ký khóa học
export const getEnrolledStudents = async (req, res) => {
    const { id } = req.params; // Lấy courseId từ params
    try {
        // Tìm khóa học theo ID và chỉ lấy danh sách enrolledStudents
        const course = await Course.findById(id).select('enrolledStudents');

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // Trả về danh sách ID của enrolledStudents
        res.json({ success: true, enrolledStudents: course.enrolledStudents });
    } catch (error) {
        console.error("Error fetching enrolled students:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId; // Lấy userId từ token xác thực

        // Tìm các khóa học mà user đã đăng ký
        const enrolledCourses = await Course.find({ enrolledStudents: userId }, 'courseTitle courseThumbnail courseDescription coursePrice');

        if (!enrolledCourses || enrolledCourses.length === 0) {
            return res.status(404).json({ success: false, message: "No enrolled courses found" });
        }

        res.json({ success: true, enrolledCourses });
    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};