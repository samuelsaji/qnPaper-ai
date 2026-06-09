import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { user_id, name, email }
  const [currentPage, setCurrentPage] = useState("login");
  const [sharedFiles, setSharedFiles] = useState({
    Notes: [],
    Syllabus: [],
    "Previous Papers": [],
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("qp_token");
    const userRaw = localStorage.getItem("qp_current_user");
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setIsAuthenticated(true);
        setCurrentUser(user);
        const path = location.pathname.replace("/", "");
        const validPaths = ["dashboard", "generate", "templates", "settings", "paper-preview"];
        setCurrentPage(validPaths.includes(path) ? path : "dashboard");
        if (location.pathname === "/") navigate("/dashboard", { replace: true });
      } catch {
        localStorage.removeItem("qp_token");
        localStorage.removeItem("qp_current_user");
      }
    } else {
      if (location.pathname !== "/") navigate("/", { replace: true });
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem("qp_token", token);
    localStorage.setItem("qp_current_user", JSON.stringify(user));
    localStorage.setItem("qp_auth", "true"); // keep for ProtectedRoute compat
    setIsAuthenticated(true);
    setCurrentUser(user);
    window.dispatchEvent(new Event("qp_profile_changed"));
  };

  const logout = () => {
    localStorage.removeItem("qp_token");
    localStorage.removeItem("qp_current_user");
    localStorage.removeItem("qp_auth");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage("login");
    window.dispatchEvent(new Event("qp_profile_changed"));
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        setCurrentUser,
        currentPage,
        setCurrentPage,
        sharedFiles,
        setSharedFiles,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
