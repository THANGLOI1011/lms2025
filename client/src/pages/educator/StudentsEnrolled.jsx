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
        const { data } = await axios.get(`${backendUrl}/api/educator/purchase`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
            console.log("Purchases:", data.purchases); // Debug: Kiểm tra dữ liệu trả về
            setEnrolledStudents(data.purchases.reverse()); // Lưu dữ liệu vào state
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        console.error("Error fetching purchases:", error);
        toast.error(error.message);
    }
};

const handleDeleteStudent = async (purchaseId) => {
  try {
      const token = await getToken();
      const { data } = await axios.delete(`${backendUrl}/api/educator/purchases/${purchaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
          toast.success(data.message);
          setEnrolledStudents((prev) => prev.filter((item) => item._id !== purchaseId)); //giữ lại các phần tử khác trong mảng
      } else {
          toast.error(data.message);
      }
  } catch (error) {
      console.error("Error deleting purchase:", error);
      toast.error(error.message);
  }
};
  
  
  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents();
    }
  }, [isEducator]);

  return enrolledStudents ? (
    
    <div className='min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='flex flex-col items-center w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
        <table className='table-fixed md:table-auto w-full overflow-hidden pb-4'>
          <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
            <tr>
              <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
              <th className='px-4 py-3 font-semibold '>Student Name</th>
              <th className='px-4 py-3 font-semibold '>Course Title</th>
              <th className='px-4 py-3 font-semibold '>Status</th>
              <th className='px-4 py-3 font-semibold hidden sm:table-cell'>Date</th>
              <th className='px-4 py-3 font-semibold'>Progress</th>
            </tr>
          </thead>
          <tbody className='text-sm text-gray-500'>
  {enrolledStudents.map((item, index) => (
    <tr key={item._id} className='border-b border-gray-500/20 '>
      <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
      <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
        <img src={item.student?.imageUrl || "https://via.placeholder.com/50"} alt="" className='w-9 h-9 rounded-full' />
        <span className='truncate'>{item.student?.name || "Unknown"}</span>
      </td>
      <td className='px-4 py-3 truncate  max-w-xs'>{item.course?.courseTitle}</td>
      <td className='px-4 py-3 truncate '>{item.status}</td>
      <td className='px-4 py-3 hidden sm:table-cell'>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "No Date"}
      </td>
      <td className='px-4 py-3 truncate'>
        {item.courseProgressId || "No Progress"}
      </td>
      <td className='px-4 py-3'>
        <button
          onClick={() => handleDeleteStudent(item._id)} // Truyền `purchaseId` vào hàm
          className='bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600'
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
  ) : <Loading />;
}

export default StudentsEnrolled;
