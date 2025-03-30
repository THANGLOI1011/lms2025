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
      const interval = setInterval(() => {
        setWatchTime((prev) => {
          const newWatchTime = prev + 1;
          if (progressData?.lectureCompleted?.includes(playerData.lectureId)) {
            setIsEligibleToComplete(true);
          } else if (newWatchTime >= targetWatchTime) {
            setIsEligibleToComplete(true);
          }
  
          return newWatchTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  };
  

  const handlePlayerReady = (event) => {
    const duration = event.target.getDuration();
    setVideoDuration(duration);
  };

  const targetWatchTime = videoDuration * 0.05; // 5% tổng thời gian video
  const progressPercentage = progressData?.lectureCompleted?.includes(playerData?.lectureId)
  ? 100 // Nếu bài học đã hoàn thành, luôn hiển thị 100%
  : targetWatchTime > 0 
    ? (watchTime / targetWatchTime) * 100 
    : 0;

const clampedProgress = Math.min(progressPercentage, 100);




useEffect(() => {
  if (progressData?.courseCompleted) {
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
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                <div className='flex items-center justify-between px-4 py-3 cursor-pointer select-none' onClick={() => setOpenSections(prev => ({ ...prev, [index]: !prev[index] }))}>
                  <div className='flex items-center gap-2'>
                    <img className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`} src={assets.down_arrow_icon} alt="arrow icon" />
                    <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
                  </div>
                  <p className='text-sm md:text-default'>{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-96' : 'max-h-0'}`}>
                  <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className='flex items-start gap-2 py-1'>
                        <img src={progressData?.lectureCompleted?.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="playicon" className='w-4 h-4 mt-1' />
                        <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-[15px]'>
                          <p>{lecture.lectureTitle}</p>
                          <div className='flex gap-2'>
                            {lecture.lectureUrl && (
                              <p 
                              onClick={() => {
                                const selectedLecture = { ...lecture, chapter: index + 1, lecture: i + 1 };
                                setPlayerData(selectedLecture);
                            
                                // Nếu bài học đã completed, set watchTime ngay lập tức
                                if (progressData?.lectureCompleted?.includes(lecture.lectureId)) {
                                  setWatchTime(targetWatchTime);
                                  setIsEligibleToComplete(true);
                                } else {
                                  setWatchTime(0); // Reset nếu chưa hoàn thành
                                  setIsEligibleToComplete(false);
                                }
                              }} 
                              className='text-blue-500 cursor-pointer'
                            >
                              Watch
                            </p>
                            
                            )}
                            <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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
              className={`text-blue-600 ${!isEligibleToComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
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
