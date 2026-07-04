import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ResumeProvider } from './context/ResumeContext';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Editor } from './features/editor/Editor';
import { AtsPage } from './features/ats/AtsPage';
import { CoverLetterPage } from './features/coverletter/CoverLetterPage';
import { InterviewPage } from './features/interview/InterviewPage';
import { AuthForm } from './features/auth/AuthForm';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

function App() {
  return (
    <ResumeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthForm />} />

          {/* All authenticated routes wrapped in AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Editor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id/:section"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Editor />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ats"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AtsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cover-letter"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CoverLetterPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <InterviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ResumeProvider>
  );
}

export default App;
