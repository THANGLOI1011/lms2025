import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Line } from 'rc-progress';
import Footer from '../../components/student/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyEnrollments = () => {
  const {
    enrolledCourses,
    calculateCourseDuration,
    navigate,
    userData,
    fetchUserEnrolledCourses,
    backendUrl,
    getToken,
    calculateNoOfLectures
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);

  // 🔍 Fetch course progress
  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      setProgressArray([]); // Reset trước khi fetch mới
  
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            console.log(`🚀 Fetching progress for course: ${course._id}`);
            const { data } = await axios.post(
              `${backendUrl}/api/user/get-course-progress`,
              { courseId: course._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
  
            console.log(`📌 API Response for ${course.courseTitle}:`, data);
  
            if (!data || !data.progressData || !Array.isArray(data.progressData.lectureCompleted)) {
              console.warn(`⚠️ No progress data found for ${course.courseTitle}`);
              return { 
                courseTitle: course.courseTitle,
                totalLectures: calculateNoOfLectures(course), 
                lectureCompleted: 0, 
                isCompleted: false 
              };
            }
  
            const totalLectures = calculateNoOfLectures(course);
            const lectureCompleted = data.progressData.lectureCompleted.length;
            const isCompleted = lectureCompleted === totalLectures; 
  
            console.log(`✅ Progress for ${course.courseTitle}: ${lectureCompleted}/${totalLectures}`);
  
            return { 
              courseTitle: course.courseTitle,
              totalLectures, 
              lectureCompleted, 
              isCompleted 
            };
          } catch (err) {
            console.error("❌ Error fetching progress for course:", course._id, err);
            return { 
              courseTitle: course.courseTitle,
              totalLectures: 1, 
              lectureCompleted: 0, 
              isCompleted: false 
            };
          }
        })
      );
  
      console.log("✅ Updated Progress Array:", tempProgressArray);
      setProgressArray([...tempProgressArray]); // Copy mới để React cập nhật UI
    } catch (error) {
      toast.error("Error fetching course progress: " + error.message);
    }
  };

  // 🔍 Fetch enrolled courses khi userData thay đổi
  useEffect(() => {
    if (userData) {
      console.log("📌 Fetching enrolled courses for user:", userData);
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  // 🔍 Fetch course progress khi enrolledCourses thay đổi
  useEffect(() => {
    if (enrolledCourses.length > 0) {
      console.log("✅ Enrolled courses updated:", enrolledCourses);
      getCourseProgress(); 
    }
  }, [enrolledCourses]);

  return (
    <>
      <div className='md:px-36 px-8 pt-10'>
        <h1 className='text-2xl font-semibold'>My Enrollments</h1>

        {enrolledCourses.length === 0 ? (
          <p className="text-center text-gray-600 mt-10">You have not enrolled in any courses yet.</p>
        ) : (
          <table className='md:table-auto table-fixed w-full overflow-hidden border border-gray-200 mt-10'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>Course</th>
                <th className='px-4 py-3 font-semibold truncate'>Duration</th>
                <th className='px-4 py-3 font-semibold truncate'>Completed</th>
                <th className='px-4 py-3 font-semibold truncate'>Status</th>
              </tr>
            </thead>
            <tbody className='text-gray-700'>
              {console.log("🔍 Progress Array in UI:", progressArray)}
              {enrolledCourses.map((course) => {
                const progress = progressArray.find((p) => p.courseTitle === course.courseTitle) || { totalLectures: 1, lectureCompleted: 0 };
                const progressPercentage = (progress.lectureCompleted * 100) / progress.totalLectures || 0;
                const isCompleted = progress.lectureCompleted > 0 && progress.lectureCompleted === progress.totalLectures;

                return (
                  <tr key={course._id} className='border-b border-gray-500/20'>
                    <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                      <img src={course.courseThumbnail} alt={course.courseTitle} className='w-14 sm:w-24 md:w-28' />
                      <div className='flex-1'>
                        <p className='mb-1 max-sm:text-sm'>{course.courseTitle}</p>
                        <Line strokeWidth={2} percent={progressPercentage} className='bg-gray-300 rounded-full' />
                      </div>
                    </td>
                    <td className='px-4 py-3 max-sm:hidden'>
                      {calculateCourseDuration(course)}
                    </td>
                    <td className='px-4 py-3 max-sm:hidden'>
                      {progress.lectureCompleted ?? 0} / {progress.totalLectures} Lectures
                    </td>
                    <td className='px-4 py-3 max-sm:text-right'>
                      <button
                        className={`px-3 sm:px-5 py-1.5 sm:py-2 text-white ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
                        onClick={() => navigate(`/player/${course._id}`)}
                      >
                        {isCompleted ? 'Completed' : 'On Going'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;
