import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyCourses = () => {
  const { currency,backendUrl,isEducator,getToken } = useContext(AppContext)
  const [ courses,setCourses ] = useState(null)
  const fetchEducatorCourses = async () => {
    try{
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/courses', {headers:{Authorization:`Bearer ${token}`}})

      data.success && setCourses(data.courses)
    }catch(error){
      toast.error(error.message)
    }
  }

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const token = await getToken();
        const { data } = await axios.delete(`${backendUrl}/api/educator/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (data.success) {
          toast.success('Course deleted successfully!');
          setCourses(courses.filter((course) => course._id !== courseId));
        } else {
          toast.error(data.message || 'Unable to delete course.');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the course.');
      }
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
                <tr key={course._id} className='border-b border-gray-500/20'>
                    <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate'>
                      <img src={course.courseThumbnail} alt="Course Image"  className='w-16'/>
                      <span className='truncate hidden md:block'>{course.courseTitle}</span>
                    </td>
                    
                    <td className='px-4 py-3'>
                    {currency} {course.coursePrice}
                    </td>
                    <td className='px-4 py-3'>{course.enrolledStudents.length}</td>
                    <td className='px-4 py-3'>{new Date(course.createdAt).toLocaleDateString()}</td>
                    <td className='px-4 py-3'>
                    <button 
                      onClick={() => handleDelete(course._id)} 
                      className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
                      >Delete</button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : <Loading/>
}

export default MyCourses
