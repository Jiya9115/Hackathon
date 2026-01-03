import { Navigate, Outlet } from "react-router-dom"

const ProtectedRoute = () => {
  const isLoggedIn = localStorage.getItem("employeeLoggedIn")
  return isLoggedIn ? <Outlet /> : <Navigate to="/employee/login" />
}

export default ProtectedRoute
