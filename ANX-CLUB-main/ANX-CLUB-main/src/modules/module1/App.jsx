import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProfileView from './components/Profile/ProfileView';
import ProfileEdit from './components/Profile/ProfileEdit';
import UserList from './components/Admin/UserList';
import './index.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, userProfile } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && userProfile?.role !== 'Admin') {
    return <Navigate to="/profile" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router basename="/module1">
        <div className="app-container">
          <Navbar />
          <main className="main-content animate-fade-in">
            <Routes>
              <Route path="/" element={<Navigate to="/profile" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/edit" 
                element={
                  <ProtectedRoute>
                    <ProfileEdit />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UserList />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
