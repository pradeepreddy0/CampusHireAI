// ============================================================
// App.jsx — Route Definitions & Layout
//
// Defines all client-side routes and wraps them with:
//   - Navbar (always visible when authenticated)
//   - ProtectedRoute (redirects unauthenticated users)
//   - Role-based routing (student vs admin pages)
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

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

function App() {
    const { isAuthenticated, isAdmin } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Show Navbar only when logged in */}
            {isAuthenticated && <Navbar />}

            <main className={isAuthenticated ? 'pt-4 pb-8' : ''}>
                <Routes>
                    {/* ── Public Routes ──────────────────────────── */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
                    />
                    <Route
                        path="/signup"
                        element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
                    />

                    {/* ── Protected Routes ───────────────────────── */}
                    <Route element={<ProtectedRoute />}>
                        {/* Home — redirect based on role */}
                        <Route
                            path="/"
                            element={
                                isAdmin
                                    ? <Navigate to="/admin/dashboard" />
                                    : <Navigate to="/student/dashboard" />
                            }
                        />

                        {/* Student pages */}
                        <Route path="/student/dashboard" element={<StudentDashboard />} />
                        <Route path="/drives" element={<DriveList />} />
                        <Route path="/drives/:driveId/apply" element={<ApplyDrive />} />
                        <Route path="/resume/upload" element={<ResumeUpload />} />
                        <Route path="/training" element={<TrainingRecommendations />} />

                        {/* Admin pages */}
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/drives" element={<DriveList />} />
                        <Route path="/admin/shortlist/:driveId" element={<ShortlistResults />} />

                        {/* Shared */}
                        <Route path="/shortlist/:driveId" element={<ShortlistResults />} />
                    </Route>

                    {/* ── Fallback ───────────────────────────────── */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
