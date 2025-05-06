import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/student/Footer'
import Rating from '../../components/student/Rating'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/student/Loading'

const Player = () => {
  const { enrolledCourses, calculateChapterTime, backendUrl, getToken, userData, fetchUserEnrolledCourses } = useContext(AppContext);
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [watchTime, setWatchTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isEligibleToComplete, setIsEligibleToComplete] = useState(false);
  
// Tìm khóa học người dùng đã ghi danh
  useEffect(() => {
    if (enrolledCourses.length > 0 && userData) {
      const foundCourse = enrolledCourses.find(course => String(course._id) === String(courseId));
      if (foundCourse) {
        setCourseData(foundCourse);
        const userRating = foundCourse.courseRatings.find(item => item.userId === userData._id);
        setInitialRating(userRating ? userRating.rating : 0);
      }
    }
  }, [enrolledCourses, userData]);

  useEffect(() => {
    if (courseId) getCourseProgress();
  }, [courseId]);
  const handleRate = async (rating) => {
    console.log("Rating course:", courseId, "with", rating);
    try{
      const token = await getToken()
      console.log("Sending rating request:", {
        courseId,
        rating,
        token
    });
      const { data } = await axios.post(backendUrl + '/api/user/add-rating',{courseId,rating,userId: userData._id},{headers:{Authorization: `Bearer ${token}`}})
      console.log("Response from server:", data);
      if(data.success){
        toast.success(data.message)
        fetchUserEnrolledCourses()
      }else{
        toast.error(data.message)
      }
    }catch(error){
      console.error("Error rating course:", error);
      toast.error(error.message)
    }
  }
  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(backendUrl + '/api/user/get-course-progress', { courseId }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const markLectureAsCompleted = async (lectureId) => {
    if (!isEligibleToComplete) return;

    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + '/api/user/update-course-progress',
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setTimeout(getCourseProgress, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  

  const handlePlayerStateChange = (event) => {
    if (event.data === 1) { // Video đang phát
      if (!isEligibleToComplete && !playerData?.interval) { // Chưa nhán "Completed" và chua dừng interval
        const interval = setInterval(() => { // Tăng watchTime mỗi giây
          setWatchTime((prev) => { // Cập nhật watchTime
            const newWatchTime = prev + 1; // Tăng thêm 1 giây
  
            if (newWatchTime >= targetWatchTime) { // Nếu đạt đủ thời gian xem
              setIsEligibleToComplete(true); // Đánh dấu có thể nhấn "Completed"
              clearInterval(interval); // Dừng interval khi đạt đủ thời gian
            }
  
            return newWatchTime;
          });
        }, 1000);
  
        // Lưu interval để dừng khi video dừng
        setPlayerData((prev) => ({ ...prev, interval }));
      }
    } else if (event.data === 2 || event.data === 0) { // Video tạm dừng hoặc kết thúc
      if (playerData?.interval) { // Nếu có interval đang chạy
        clearInterval(playerData.interval); // Dừng interval
        setPlayerData((prev) => ({ ...prev, interval: null })); // Reset interval
      }
    }
  };

  const handlePlayerReady = (event) => {
    const duration = event.target.getDuration(); // lấy tổng số thời gian của video tính bằng giây
    console.log("Video duration:", duration);
    setVideoDuration(duration); // lưu tổng thời gian video vào state
  };

  const targetWatchTime = videoDuration * 0.05; // 5% tổng thời gian video
  const progressPercentage = progressData?.lectureCompleted?.includes(playerData?.lectureId)
    ? 100 // Nếu bài học đã hoàn thành, luôn hiển thị 100%
    : targetWatchTime > 0
      ? (watchTime / targetWatchTime) *  100 // thời gian xem hiện tại chia cho thời gian yêu cầu ví dụ 5% của tổng thời gian 10s thì ( 5 / 10) * 100 = 50%
      : 0;
  
  const clampedProgress = Math.min(progressPercentage, 100); // Giới hạn giá trị không vượt quá 100%
  
  useEffect(() => {
    if (watchTime >= targetWatchTime) { // Nếu thời gian xem đạt yêu cầu thì dánh dấu có thể nhấn "Completed"
      setIsEligibleToComplete(true);
    }
  }, [watchTime]);




useEffect(() => {
  if (progressData?.courseCompleted) { // Nếu khóa học đã hoàn thành, không cần theo dõi thời gian xem nữa
    setWatchTime(targetWatchTime); // Đặt watchTime đạt mức yêu cầu ngay lập tức
    setIsEligibleToComplete(true); // Đánh dấu có thể nhấn "Completed"
  }
}, [progressData]);


  return courseData ? (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
        {/* Left Column */}
        <div className='text-gray-800'>
          <h2 className='text-xl font-semibold'>Course Structure</h2>
          <div className='pt-5'>
          {courseData.courseContent.map((chapter, index) => {
  const isPreviousChapterCompleted =
    index === 0 || courseData.courseContent[index - 1].chapterContent.every((lecture) =>
      progressData?.lectureCompleted?.includes(lecture.lectureId)
    );

  return (
    <div key={index} className={`border border-gray-300 bg-white mb-2 rounded ${!isPreviousChapterCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${!isPreviousChapterCompleted ? 'pointer-events-none' : ''}`}
        onClick={() => setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }))}
      >
        <div className='flex items-center gap-2'>
          <img
            className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
            src={assets.down_arrow_icon}
            alt="arrow icon"
          />
          <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
        </div>
        <p className='text-sm md:text-default'>{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-96' : 'max-h-0'}`}>
        {/* Nội dung bài học */}
        <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
          {chapter.chapterContent.map((lecture, i) => {
            const isPreviousLectureCompleted =
              i === 0 || progressData?.lectureCompleted?.includes(chapter.chapterContent[i - 1].lectureId);
            const isCurrentLectureCompleted = progressData?.lectureCompleted?.includes(lecture.lectureId);

            return (
              <li key={i} className='flex items-start gap-2 py-1'>
                <img
                  src={isCurrentLectureCompleted ? assets.blue_tick_icon : assets.play_icon}
                  alt="playicon"
                  className='w-4 h-4 mt-1'
                />
                <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-[15px]'>
                  <p>{lecture.lectureTitle}</p>
                  <div className='flex gap-2'>
                    {lecture.lectureUrl && (
                      <p
                        onClick={() => {
                          if (!isPreviousLectureCompleted) {
                            toast.error('You need to complete the previous lesson to unlock this lesson..');
                            return;
                          }

                          const selectedLecture = { ...lecture, chapter: index + 1, lecture: i + 1 };
                          setPlayerData(selectedLecture);
                          //reset trạng thái khi chuyển bài học
                          setWatchTime(0);
                          setIsEligibleToComplete(false);
                          // Nếu bài học đã hoàn thành, set watchTime ngay lập tức
                          if (isCurrentLectureCompleted) {
                            setWatchTime(targetWatchTime);
                            setIsEligibleToComplete(true);
                          } else {
                            setWatchTime(0); // Reset nếu chưa hoàn thành
                            setIsEligibleToComplete(false);
                          }
                        }}
                        className={`text-blue-500 cursor-pointer ${!isPreviousLectureCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Watch
                      </p>
                    )}
                    <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
})}
          </div>
          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className='text-xl font-bold'>Rate this Course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* Right Column */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube 
                videoId={playerData?.lectureUrl?.split('/').pop()} 
                iframeClassName='w-full aspect-video'
                onStateChange={handlePlayerStateChange} 
                onReady={handlePlayerReady}
              />

              {/* Progress Bar */}
                            {!progressData?.lectureCompleted?.includes(playerData?.lectureId) && (
                <div className="w-full bg-gray-200 rounded-full h-1 my-2">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${clampedProgress}%` }}
                  ></div>
                </div>
              )}



              <div className='flex justify-between items-center mt-1'>
                <p>{playerData?.chapter}.{playerData?.lecture} {playerData?.lectureTitle}</p>
              <button 
              onClick={() => markLectureAsCompleted(playerData.lectureId)}
              className={`text-blue-600 ${!isEligibleToComplete ? 'opacity-50 cursor-not-allowed' : ''} cursor-pointer`}
              disabled={!isEligibleToComplete}
            >
              {progressData?.lectureCompleted?.includes(playerData.lectureId) ? 'Completed' : 'Mark Complete'}
            </button>

              </div>
            </div>
          ) : (
            <img src={courseData?.courseThumbnail || ''} alt="Course Thumbnail" />
          )}
        </div>
      </div>
      <Footer />
    </>
  ) : <Loading />;
};

export default Player;
