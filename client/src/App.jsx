import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Login from './pages/Login';
import Browse from './pages/Browse';
import PostProject from './pages/PostProject';
import ProtectedRoute from './components/ProtectedRoute';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import ProjectDetail from './pages/ProjectDetail';
import PublicProfile from './pages/PublicProfile';
import Signup from './pages/Signup';
import AskAI from './pages/AskAI';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <Browse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostProject />
              </ProtectedRoute>
            }
          />
          <Route path="/requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/ask-ai" element={<ProtectedRoute><AskAI /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}