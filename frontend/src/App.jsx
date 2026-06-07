import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";

const ALLOWED_ADMIN_EMAILS = [
  "admin1@freexy.ai",
  "admin2@freexy.ai",
  "admin3@freexy.ai",
  "admin4@freexy.ai"
];

// Admin Route Guard
function AdminRoute({ children }) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  if (!user.isAdmin || !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;