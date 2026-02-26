// ============================================================
// App.jsx — Route Definitions with DashboardLayout
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PageTransition from './components/PageTransition'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DriveList from './pages/DriveList'
import ApplyDrive from './pages/ApplyDrive'
import ResumeUpload from './pages/ResumeUpload'
import ShortlistResults from './pages/ShortlistResults'
import TrainingRecommendations from './pages/TrainingRecommendations'
import AdminTrainingManager from './pages/AdminTrainingManager'
import InterviewExperiences from './pages/InterviewExperiences'
import StudentReviews from './pages/StudentReviews'

// Wrap page in transition
const P = ({ children }) => <PageTransition>{children}</PageTransition>

function App() {
    const { isAuthenticated, isAdmin } = useAuth()

    return (
        <Routes>
            {/* Public — no layout shell */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />

            {/* Protected — wrapped in DashboardLayout */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={isAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/student/dashboard" />} />

                {/* Student */}
                <Route path="/student/dashboard" element={<P><StudentDashboard /></P>} />
                <Route path="/drives" element={<P><DriveList /></P>} />
                <Route path="/drives/:driveId/apply" element={<P><ApplyDrive /></P>} />
                <Route path="/resume/upload" element={<P><ResumeUpload /></P>} />
                <Route path="/training" element={<P><TrainingRecommendations /></P>} />
                <Route path="/experiences" element={<P><InterviewExperiences /></P>} />
                <Route path="/experiences/:driveId" element={<P><InterviewExperiences /></P>} />

                {/* Admin */}
                <Route path="/admin/dashboard" element={<P><AdminDashboard /></P>} />
                <Route path="/admin/drives" element={<P><DriveList /></P>} />
                <Route path="/admin/shortlist/:driveId" element={<P><ShortlistResults /></P>} />
                <Route path="/admin/training" element={<P><AdminTrainingManager /></P>} />
                <Route path="/admin/experiences" element={<P><InterviewExperiences /></P>} />

                {/* Shared */}
                <Route path="/shortlist/:driveId" element={<P><ShortlistResults /></P>} />
                <Route path="/reviews" element={<P><StudentReviews /></P>} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

export default App
