import React, { useContext, useEffect, useState } from 'react'
import Loading from '../../components/student/Loading'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const StudentsEnrolled = () => {
  const { backendUrl, getToken, isEducator } = useContext(AppContext)
  const [enrolledStudents, setEnrolledStudents] = useState(null)

  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/enrolled-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("API Raw Response:", data); // Log toàn bộ response
  
      if (data.success) {
        console.log("Enrolled Students:", data.enrolledStudents); // Kiểm tra danh sách sinh viên
        setEnrolledStudents(data.enrolledStudents.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(error.message);
    }
  };
  
  


  const handleDeleteStudent = async (studentId) => {
    if (!studentId) {
      console.error("Invalid student ID:", studentId);
      toast.error("Invalid student ID");
      return;
    }
  
    try {
      const token = await getToken();
      console.log(`Sending DELETE request for student ID: ${studentId}`);
  
      const { data } = await axios.delete(`${backendUrl}/api/educator/enrolled-students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (data.success) {
        console.log(`Student ${studentId} removed successfully`);
        setEnrolledStudents(prevStudents => prevStudents.filter(student => student.student?.id !== studentId));
        toast.success("Student removed successfully");
      } else {
        console.error("API Error:", data);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting student:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.message);
    }
  };
  
  
  
  
  
  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents();
    }
  }, [isEducator]);

  return enrolledStudents ? (
    <div className='min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
        <table className='table-fixed md:table-auto w-full overflow-hidden pb-4'>
          <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
            <tr>
              <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
              <th className='px-4 py-3 font-semibold '>Student Name</th>
              <th className='px-4 py-3 font-semibold '>Course Title</th>
              <th className='px-4 py-3 font-semibold '>Status</th>
              <th className='px-4 py-3 font-semibold hidden sm:table-cell'>Date</th>
              <th className='px-4 py-3 font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody className='text-sm text-gray-500'>
            {enrolledStudents.map((item, index) => (
              <tr key={item.student?.id} className='border-b border-gray-500/20'>
                <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
                <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                  <img src={item.student?.imageUrl || "https://via.placeholder.com/50"} alt="" className='w-9 h-9 rounded-full' />
                  <span className='truncate'>{item.student?.name || "Unknown"}</span>
                </td>
                <td className='px-4 py-3 truncate'>{item.courseTitle || "No Course Title"}</td>
                <td className='px-4 py-3 truncate'>{item.status}</td>
                <td className='px-4 py-3 hidden sm:table-cell'>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "No Date"}</td>
                <td className='px-4 py-3'>
  {console.log("Student Item:", item)} {/* Log item để kiểm tra */}
  <button 
    onClick={() => {
      if (!item.student) {
        toast.error("Student data is missing");
        console.error("Invalid student object:", item);
        return;
      }
      handleDeleteStudent(item.student.id);
    }} 
    className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'>
    Delete
  </button>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : <Loading />;
}

export default StudentsEnrolled;
