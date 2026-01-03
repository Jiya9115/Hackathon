import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, FileText, DollarSign, Settings, 
  Search, Bell, Moon, Sun, LogOut, ChevronLeft, Check, X, 
  UserCircle, Briefcase, Clock, Plus, MoreHorizontal, ArrowRight, Download, Filter 
} from 'lucide-react';
import './style.css';

export default function DayflowApp() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) setUser(data);
      else alert("Invalid Credentials!");
    } catch { alert("Backend not running!"); }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return user.role === 'admin' 
    ? <AdminLayout user={user} onLogout={()=>setUser(null)} isDark={isDark} toggleTheme={()=>setIsDark(!isDark)} />
    : <EmployeeLayout user={user} onLogout={()=>setUser(null)} isDark={isDark} toggleTheme={()=>setIsDark(!isDark)} />;
}

// ------------------- ADMIN PANEL -------------------
function AdminLayout({ user, onLogout, isDark, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetch('http://localhost:5001/api/employees').then(res=>res.json()).then(setEmployees);
    fetch('http://localhost:5001/api/leaves').then(res=>res.json()).then(setLeaves);
  }, []);

  return (
    <div className="app-container">
      <Sidebar role="admin" active={activeTab} setActive={setActiveTab} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={onLogout} />
      <main className="main-view">
        <Header title={activeTab} user={user} isDark={isDark} toggleTheme={toggleTheme} />
        
        {activeTab === 'Dashboard' && <DashboardView employees={employees} leaves={leaves} />}
        {activeTab === 'Employees' && <EmployeesView employees={employees} />}
        {activeTab === 'Attendance' && <AttendanceView />}
        {activeTab === 'Leave Requests' && <LeaveRequestsView leaves={leaves} setLeaves={setLeaves} />}
        {activeTab === 'Payroll' && <PayrollView employees={employees} />}
        {activeTab === 'Settings' && <SettingsView user={user} isDark={isDark} toggleTheme={toggleTheme} />}
      </main>
    </div>
  );
}

// --- 1. DASHBOARD VIEW ---
const DashboardView = ({ employees, leaves }) => {
  const pending = leaves.filter(l => l.status === 'Pending').length;
  const payroll = employees.reduce((a, b) => a + (b.salary || 0), 0);
  
  return (
    <>
      <div className="stat-grid">
        <StatCard title="Total Employees" val={employees.length} sub="Active Staff" color="var(--primary)" icon={<Users size={20}/>} />
        <StatCard title="Present Today" val={Math.floor(employees.length * 0.9)} sub="90% attendance" color="var(--green)" icon={<Clock size={20}/>} />
        <StatCard title="Pending Leaves" val={pending} sub="Action Required" color="var(--orange)" icon={<Briefcase size={20}/>} />
        <StatCard title="Payroll Cost" val={`₹${(payroll/100000).toFixed(2)}L`} sub="Monthly" color="#06b6d4" icon={<DollarSign size={20}/>} />
      </div>
      <div className="grid-2">
        <div className="card"><h3>Weekly Attendance</h3><div className="chart-bars">{[45,48,42,50,47].map((h,i)=><div key={i} className="bar-col"><div className="bar-seg" style={{height:`${h*3}px`, background:'var(--green)'}}></div></div>)}</div></div>
        <div className="card"><h3>Recent Activity</h3><p style={{color:'gray'}}>System initialized with 50 records.</p></div>
      </div>
    </>
  );
};

// --- 2. EMPLOYEES VIEW ---
const EmployeesView = ({ employees }) => {
  const [term, setTerm] = useState('');
  const filtered = employees.filter(e => e.name.toLowerCase().includes(term.toLowerCase()));
  
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <div style={{position:'relative'}}><Search className="search-icon" size={16}/><input className="input-field" placeholder="Search..." style={{paddingLeft:'35px'}} value={term} onChange={e=>setTerm(e.target.value)}/></div>
        <button className="btn-primary">+ Add Employee</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Salary</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e._id}>
                <td><b>{e.name}</b><br/><span style={{fontSize:'11px', color:'gray'}}>{e.email}</span></td>
                <td>{e.role}</td><td>{e.dept}</td><td>₹{e.salary.toLocaleString()}</td>
                <td><span className="pill pill-active">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 3. ATTENDANCE VIEW (IMPROVED) ---
const AttendanceView = () => {
  const [logs, setLogs] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toDateString());

  useEffect(() => {
    fetch(`http://localhost:5001/api/attendance?date=${filterDate}`)
      .then(res => res.json())
      .then(setLogs);
  }, [filterDate]);

  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <div>
          <h3>Daily Attendance</h3>
          <p style={{fontSize:'13px', color:'gray'}}>Tracking {logs.length} records</p>
        </div>
        <div style={{display:'flex', gap:'10px'}}>
          <select className="input-field" value={filterDate} onChange={e=>setFilterDate(e.target.value)}>
            <option value={new Date().toDateString()}>Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="2 days ago">2 Days Ago</option>
          </select>
          <button className="btn-icon"><Download size={18}/></button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i}>
                <td><b>{log.name}</b><br/><span style={{fontSize:'11px', color:'gray'}}>EMP{log.employeeId}</span></td>
                <td>{log.date}</td>
                <td style={{color: 'var(--green)'}}>{log.checkIn}</td>
                <td style={{color: 'var(--red)'}}>{log.checkOut}</td>
                <td><span className={`pill pill-${log.status.toLowerCase()}`}>{log.status}</span></td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No records found for this date.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 4. PAYROLL VIEW (IMPROVED) ---
const PayrollView = ({ employees }) => {
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
        <h3>Payroll Processing</h3>
        <button className="btn-primary">Process All Payments</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Employee</th><th>Base Salary</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
          <tbody>
            {employees.map(e => {
              const allowance = 2000;
              const deduction = Math.floor(Math.random() * 1000);
              const net = e.salary + allowance - deduction;
              return (
                <tr key={e._id}>
                  <td><b>{e.name}</b><br/><span style={{fontSize:'11px', color:'gray'}}>{e.dept}</span></td>
                  <td>₹{e.salary.toLocaleString()}</td>
                  <td style={{color:'var(--green)'}}>+ ₹{allowance}</td>
                  <td style={{color:'var(--red)'}}>- ₹{deduction}</td>
                  <td style={{fontWeight:'bold'}}>₹{net.toLocaleString()}</td>
                  <td><span className="pill pill-pending">Pending</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 5. SETTINGS VIEW (IMPROVED) ---
const SettingsView = ({ user, isDark, toggleTheme }) => {
  return (
    <div className="grid-2">
      <div className="card">
        <h3>Profile Settings</h3>
        <div className="input-group"><label className="input-label">Full Name</label><input className="input-field" defaultValue={user.name}/></div>
        <div className="input-group"><label className="input-label">Email</label><input className="input-field" defaultValue={user.email} disabled/></div>
        <div className="input-group"><label className="input-label">Role</label><input className="input-field" defaultValue={user.title} disabled/></div>
        <button className="btn-primary" style={{marginTop:'20px'}} onClick={()=>alert('Profile Updated!')}>Save Changes</button>
      </div>
      <div className="card">
        <h3>App Preferences</h3>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', borderBottom:'1px solid var(--border)'}}>
          <div><b>Dark Mode</b><p style={{fontSize:'12px', color:'gray'}}>Toggle app theme</p></div>
          <button className="btn-primary" onClick={toggleTheme}>{isDark ? 'Disable' : 'Enable'}</button>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', borderBottom:'1px solid var(--border)'}}>
          <div><b>Email Notifications</b><p style={{fontSize:'12px', color:'gray'}}>Receive updates via email</p></div>
          <input type="checkbox" defaultChecked style={{accentColor:'var(--primary)'}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}>
          <div><b>Two-Factor Auth</b><p style={{fontSize:'12px', color:'gray'}}>Extra security</p></div>
          <button className="btn-icon">Setup</button>
        </div>
      </div>
    </div>
  );
};

// --- 6. LEAVE REQUESTS VIEW ---
const LeaveRequestsView = ({ leaves, setLeaves }) => {
  const handleAction = async (id, status) => {
    await fetch(`http://localhost:5001/api/leaves/${id}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ status })
    });
    setLeaves(leaves.map(l => l._id === id ? { ...l, status } : l));
  };

  return (
    <div className="card">
      <h3>Leave Requests</h3>
      <table className="data-table">
        <thead><tr><th>Employee</th><th>Dates</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l._id}>
              <td><b>{l.name}</b><br/><span style={{fontSize:'11px', color:'gray'}}>{l.type}</span></td>
              <td>{l.startDate} to {l.endDate}</td>
              <td style={{fontSize:'13px'}}>{l.reason}</td>
              <td><span className={`pill pill-${l.status.toLowerCase()}`}>{l.status}</span></td>
              <td>
                {l.status === 'Pending' && (
                  <div style={{display:'flex', gap:'8px'}}>
                    <button className="btn-icon" style={{color:'var(--green)'}} onClick={()=>handleAction(l._id, 'Approved')}><Check size={16}/></button>
                    <button className="btn-icon" style={{color:'var(--red)'}} onClick={()=>handleAction(l._id, 'Rejected')}><X size={16}/></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ------------------- EMPLOYEE PANEL -------------------
function EmployeeLayout({ user, onLogout, isDark, toggleTheme }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  
  // Leave Form State
  const [leaveData, setLeaveData] = useState({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' });

  const submitLeave = async () => {
    if(!leaveData.startDate || !leaveData.reason) return alert("Please fill all fields");
    
    const payload = {
      employeeId: user.id,
      name: user.name,
      role: user.role,
      dept: user.dept,
      ...leaveData
    };

    await fetch('http://localhost:5001/api/leaves', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    alert("Application Submitted to Admin!");
    setLeaveData({ type: 'Sick Leave', startDate: '', endDate: '', reason: '' }); // Reset
  };

  return (
    <div className="app-container">
      <Sidebar role="employee" active={activeTab} setActive={setActiveTab} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={onLogout} />
      <main className="main-view">
        <Header title={activeTab} user={user} isDark={isDark} toggleTheme={toggleTheme} />
        
        {activeTab === 'Dashboard' && (
          <div className="stat-grid">
            <StatCard title="Attendance" val={user.attendance} sub="Days Present" color="var(--primary)" icon={<Clock size={20}/>} />
            <StatCard title="Leaves" val={user.leaves} sub="Taken" color="var(--orange)" icon={<Briefcase size={20}/>} />
            <StatCard title="Salary" val={`₹${user.salary}`} sub="Monthly" color="var(--green)" icon={<DollarSign size={20}/>} />
          </div>
        )}

        {activeTab === 'My Leaves' && (
          <div className="grid-2">
             <div className="card">
                <h3>Apply for Leave</h3>
                <div style={{marginTop:'20px'}}>
                   <div className="input-group">
                     <label className="input-label">Leave Type</label>
                     <select className="input-field" value={leaveData.type} onChange={e=>setLeaveData({...leaveData, type:e.target.value})}>
                       <option>Sick Leave</option><option>Casual Leave</option><option>Privilege Leave</option>
                     </select>
                   </div>
                   <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                      <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <input type="date" className="input-field" value={leaveData.startDate} onChange={e=>setLeaveData({...leaveData, startDate:e.target.value})}/>
                      </div>
                      <div className="input-group">
                        <label className="input-label">End Date</label>
                        <input type="date" className="input-field" value={leaveData.endDate} onChange={e=>setLeaveData({...leaveData, endDate:e.target.value})}/>
                      </div>
                   </div>
                   <div className="input-group">
                     <label className="input-label">Reason</label>
                     <textarea className="input-field" rows="3" value={leaveData.reason} onChange={e=>setLeaveData({...leaveData, reason:e.target.value})}></textarea>
                   </div>
                   <button className="btn-primary" style={{width:'100%'}} onClick={submitLeave}>Submit Request</button>
                </div>
             </div>
             <div className="card">
                <h3>My Applications</h3>
                <p style={{color:'gray', fontSize:'13px'}}>Your history will appear here once processed by Admin.</p>
             </div>
          </div>
        )}

        {activeTab === 'Profile' && <div className="card"><h2>{user.name}</h2><p>{user.email}</p></div>}
        {activeTab === 'My Attendance' && <div className="card"><h3>My Attendance</h3></div>}
      </main>
    </div>
  );
}
// SHARED COMPONENTS (Sidebar, Header, LoginScreen, StatCard)
// ... Use the EXACT Shared Components from the previous response ...
const Sidebar = ({ role, active, setActive, collapsed, setCollapsed, onLogout }) => {
  const items = role === 'admin' ? ['Dashboard', 'Employees', 'Attendance', 'Leave Requests', 'Payroll', 'Settings'] : ['Dashboard', 'Profile', 'My Leaves'];
  const icons = { 'Dashboard': <LayoutDashboard/>, 'Employees': <Users/>, 'Attendance': <Calendar/>, 'Leave Requests': <FileText/>, 'Payroll': <DollarSign/>, 'Settings': <Settings/>, 'Profile': <UserCircle/>, 'My Attendance': <Clock/>, 'My Leaves': <Briefcase/> };
  return (
    <aside className="sidebar" style={{ width: collapsed ? '80px' : '260px' }}>
      <div className="sidebar-logo"><div className="logo-icon"><LayoutDashboard size={20}/></div>{!collapsed && <span style={{marginLeft:'12px', fontWeight:'700', fontSize:'22px'}}>Dayflow</span>}</div>
      <nav className="nav-menu">{items.map(i => <button key={i} onClick={()=>setActive(i)} className={`nav-item ${active===i?'active':''}`}>{icons[i]} {!collapsed && i}</button>)}</nav>
      <div style={{marginTop:'auto', paddingTop:'20px', borderTop:'1px solid var(--border)'}}><button className="nav-item" onClick={()=>setCollapsed(!collapsed)}><ChevronLeft/> {!collapsed && "Collapse"}</button><button className="nav-item" onClick={onLogout}><LogOut/> {!collapsed && "Logout"}</button></div>
    </aside>
  );
};

const Header = ({ title, user, isDark, toggleTheme }) => (
  <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems:'center' }}>
    <div><h1 style={{fontSize:'26px', fontWeight:'700'}}>{title}</h1><p>Welcome, {user.name.split(' ')[0]}</p></div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <button className="btn-icon" onClick={toggleTheme}>{isDark ? <Sun/> : <Moon/>}</button>
    </div>
  </header>
);

const StatCard = ({ title, val, sub, color, icon }) => (
  <div className="card" style={{marginBottom:0}}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
      <div><p style={{fontSize:'12px', color:'gray', textTransform:'uppercase', fontWeight:'600', marginBottom:'8px'}}>{title}</p><h2 style={{fontSize:'32px', margin:0}}>{val}</h2></div>
      <div style={{padding:'10px', background:color, borderRadius:'12px', color:'white'}}>{icon}</div>
    </div>
    <p style={{fontSize:'12px', color, marginTop:'12px'}}>{sub}</p>
  </div>
);

const ActivityItem = ({ name, text, time }) => (<div style={{marginBottom:'16px', display:'flex', gap:'12px', alignItems:'center'}}><div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#262c45', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px'}}>{name.charAt(0)}</div><div><div style={{fontSize:'14px', fontWeight:'500'}}>{name} <span style={{fontWeight:'400', color:'gray'}}>{text}</span></div><div style={{fontSize:'11px', color:'gray'}}>{time}</div></div></div>);

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
      <div className="card" style={{ width: '420px', padding:'48px', textAlign:'center' }}>
        <h2 style={{ marginBottom: '20px' }}>Dayflow Login</h2>
        <input className="input-field" placeholder="Email" style={{marginBottom:'15px'}} value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input-field" type="password" placeholder="Password" style={{marginBottom:'25px'}} value={pass} onChange={e=>setPass(e.target.value)} />
        <button className="btn-primary" style={{width:'100%'}} onClick={() => onLogin(email, pass)}>Sign In</button>
      </div>
    </div>
  );
}