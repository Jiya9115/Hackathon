import { Link } from "react-router-dom"

const EmployeeSidebar = () => {
  return (
    <div className="employee-sidebar">
      <Link to="/employee/dashboard">Dashboard</Link>
      <Link to="/employee/profile">Profile</Link>
      <Link to="/employee/attendance">Attendance</Link>
      <Link to="/employee/tasks">Tasks</Link>
      <Link to="/employee/login">Logout</Link>
    </div>
  )
}

export default EmployeeSidebar
