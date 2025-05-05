import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyCourses = () => {
  const { currency,backendUrl,isEducator,getToken } = useContext(AppContext)
  const [ courses,setCourses ] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null); // Lưu khóa học được chọn để chỉnh sửa
  const [showEditPopup, setShowEditPopup] = useState(false); // Hiển thị popup chỉnh sửa

  const fetchEducatorCourses = async () => {
    try{
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/courses', {headers:{Authorization:`Bearer ${token}`}})

      data.success && setCourses(data.courses)
    }catch(error){
      toast.error(error.message)
    }
  }

  const handleDelete = async (courseId) => { // hàm xử lý bất đồng bộ xóa khóa học 
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const token = await getToken();
        const { data } = await axios.delete(`${backendUrl}/api/educator/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (data.success) {
          toast.success('Course deleted successfully!');
          setCourses(courses.filter((course) => course._id !== courseId)); // giữ lại các phần tử khác trong mảng
        } else {
          toast.error(data.message || 'Unable to delete course.');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the course.');
      }
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course); // Lưu thông tin khóa học được chọn
    setShowEditPopup(true); // Hiển thị popup chỉnh sửa
  };

  const handleUpdateCourse = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.put(`${backendUrl}/api/educator/courses/${selectedCourse._id}`, selectedCourse, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success('Course updated successfully!');
        setCourses(courses.map(course => course._id === selectedCourse._id ? selectedCourse : course)); // Cập nhật danh sách khóa học với thông tin mới 
        setShowEditPopup(false); // Đóng popup
      } else {
        toast.error(data.message || 'Unable to update course.');
      }
    } catch (error) {
      toast.error('An error occurred while updating the course.');
    }
  };
  
  useEffect(() => {
    if(isEducator){
      fetchEducatorCourses()
    }
  },[isEducator])
  return courses ?  (
    <div className='h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
        <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>All Courses</th>
                <th className='px-4 py-3 font-semibold truncate'>Price</th>
                <th className='px-4 py-3 font-semibold truncate'>Students</th>
                <th className='px-4 py-3 font-semibold truncate'>Published On</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-500'>
              { courses.map((course) => (
                <tr key={course._id} className='border-b border-gray-500/20 '>
                    <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate'>
                      <img src={course.courseThumbnail} alt="Course Image"  className='w-16'/>
                      <span className='truncate hidden md:block'>{course.courseTitle}</span>
                    </td>
                    
                    <td className='px-4 py-3'>
                    {currency} {course.coursePrice}
                    </td>
                    <td className='px-4 py-3'>{course.enrolledStudents.length}</td>
                    <td className='px-4 py-3'>{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td className='px-4 py-3 flex '>
                      <button 
                        onClick={() => handleEdit(course)} 
                        className='bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2 cursor-pointer'
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)} 
                        className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 cursor-pointer'
                      >
                        Delete
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showEditPopup && (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
          <div className='bg-white text-gray-700 p-4 rounded relative w-full max-w-lg'>
            <h2 className='text-lg font-semibold mb-4'>Edit Course</h2>
            <div className='mb-2'>
              <p>Course Title</p>
              <input 
                type="text" 
                className='mt-1 block w-full border rounded py-1 px-2'
                value={selectedCourse.courseTitle}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, courseTitle: e.target.value })} // Cập nhật khóa học với thông tin mới
              />
            </div>
            <div className='mb-2'>
              <p>Course Price</p>
              <input 
                type="number" 
                className='mt-1 block w-full border rounded py-1 px-2'
                value={selectedCourse.coursePrice}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, coursePrice: e.target.value })}
              />
            </div>
            <div className='mb-2'>
              <p>Course Description</p>
              <textarea 
                className='mt-1 block w-full border rounded py-1 px-2'
                value={selectedCourse.courseDescription}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, courseDescription: e.target.value })}
              />
            </div>
            <div className='flex justify-end gap-2 mt-4'>
              <button 
                className='bg-gray-500 text-white px-4 py-2 rounded'
                onClick={() => setShowEditPopup(false)}
              >
                Cancel
              </button>
              <button 
                className='bg-blue-500 text-white px-4 py-2 rounded'
                onClick={handleUpdateCourse}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : <Loading/>
}

export default MyCourses
