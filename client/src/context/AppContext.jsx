import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from 'humanize-duration';
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from 'axios';
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const { getToken } = useAuth();
    const { user } = useUser();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);  // Mặc định là false
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);

    // Fetch API courses
    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/course/all`);
            if (data.success) {
                setAllCourses(data.courses);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Fetch user data
    const fetchUserData = async () => {
        if (!user) return;

        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/data`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setUserData(data.user);
                setIsEducator(user.publicMetadata?.role === 'educator'); // Xác định vai trò user
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Fetch user enrolled courses
    const fetchUserEnrolledCourses = async () => {
        if (!user) return;

        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setEnrolledCourses(data.enrolledCourses.reverse());
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to calculate rating
    const caculateRating = (course) => {
        if (course.courseRatings.length === 0) return 0;
        const totalRating = course.courseRatings.reduce((acc, rating) => acc + rating.rating, 0);
        return Math.floor(totalRating / course.courseRatings.length);
    };

    // Function to calculate chapter duration
    const calculateChapterTime = (chapter) => {
        const time = chapter.chapterContent.reduce((acc, lecture) => acc + lecture.lectureDuration, 0);
        return humanizeDuration(time * 60 * 1000, { units: ['h', 'm'] });
    };

    // Function to calculate course duration
    const calculateCourseDuration = (course) => {
        const time = course.courseContent.reduce((acc, chapter) => {
            return acc + chapter.chapterContent.reduce((sum, lecture) => sum + lecture.lectureDuration, 0);
        }, 0);
        return humanizeDuration(time * 60 * 1000, { units: ['h', 'm'] });
    };

    // Function to calculate number of lectures
    const calculateNoOfLecture = (course) => {
        return course.courseContent.reduce((total, chapter) => {
            return total + (Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0);
        }, 0);
    };

    // Fetch all courses when component mounts
    useEffect(() => {
        fetchAllCourses();
    }, []);

    // Fetch user data when user logs in
    useEffect(() => {
        if (user) {
            fetchUserData();
            fetchUserEnrolledCourses();
        }
    }, [user]);

    // Context value
    const value = {
        currency, allCourses, navigate, caculateRating, isEducator, setIsEducator,
        calculateChapterTime, calculateCourseDuration, calculateNoOfLecture,
        enrolledCourses, fetchUserEnrolledCourses, backendUrl, userData, setUserData, getToken, fetchAllCourses
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
