const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. CONNECT DB
mongoose.connect('mongodb://127.0.0.1:27017/dayflow')
  .then(() => {
    console.log('✅ MongoDB Connected');
    seedDatabase();
  })
  .catch(err => console.log(err));

// 2. SCHEMAS
const EmployeeSchema = new mongoose.Schema({
  id: Number, name: String, email: String, password: String,
  salary: Number, attendance: Number, leaves: Number,
  role: String, dept: String, status: String, phone: String
});
const Employee = mongoose.model('Employee', EmployeeSchema);

const LeaveSchema = new mongoose.Schema({
  employeeId: Number, name: String, role: String, dept: String,
  type: String, startDate: String, endDate: String, reason: String,
  status: { type: String, default: 'Pending' }
});
const Leave = mongoose.model('Leave', LeaveSchema);

const AttendanceSchema = new mongoose.Schema({
  employeeId: Number, name: String, date: String,
  status: String, checkIn: String, checkOut: String
});
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// 3. ROUTES
// ... (Keep existing Login/Employee/Leave routes from previous code) ...

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@gmail.com' && password === '123') {
    return res.json({ role: 'admin', name: 'John Doe', title: 'HR Admin', email: 'admin@dayflow.com' });
  }
  const user = await Employee.findOne({ email, password });
  if (user) return res.json({ role: 'employee', ...user.toObject() });
  res.status(401).json({ error: 'Invalid credentials' });
});

// Employees
app.get('/api/employees', async (req, res) => res.json(await Employee.find()));
app.post('/api/employees', async (req, res) => {
  const newEmp = new Employee(req.body);
  await newEmp.save();
  res.json(newEmp);
});

// Leaves
app.get('/api/leaves', async (req, res) => res.json(await Leave.find().sort({_id: -1})));
app.post('/api/leaves', async (req, res) => {
  const newLeave = new Leave(req.body);
  await newLeave.save();
  res.json(newLeave);
});
app.put('/api/leaves/:id', async (req, res) => {
  const updated = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// NEW: ATTENDANCE ROUTE
app.get('/api/attendance', async (req, res) => {
  const { date } = req.query;
  // Return attendance for specific date or all
  const query = date ? { date } : {};
  const data = await Attendance.find(query).sort({ employeeId: 1 });
  res.json(data);
});

app.listen(5001, () => console.log('🚀 Server running on port 5001'));

// 4. DATA SEEDING (Employees + Attendance)
const employeesList = [
  // ... (Paste your full 50 employee list here from previous steps)
  {id:1,name:"Rahul Sharma",email:"rahul@abctech.com",password:"rahul123",salary:45000,attendance:20,leaves:2,role:"Designer",dept:"Design",status:"Active"},
  {id:2,name:"Priya Patel",email:"priya@abctech.com",password:"priya123",salary:42000,attendance:21,leaves:1,role:"Manager",dept:"Marketing",status:"Active"},
  // ... add at least 5 for testing if not pasting all ...
];

async function seedDatabase() {
  // 1. Seed Employees
  if (await Employee.countDocuments() === 0) {
    await Employee.insertMany(employeesList);
    console.log("✅ Employees seeded");
  }

  // 2. Seed Attendance (Generate 3 days of history)
  if (await Attendance.countDocuments() === 0) {
    const emps = await Employee.find();
    const dates = [new Date().toDateString(), "Yesterday", "2 days ago"];
    const records = [];
    
    dates.forEach(date => {
      emps.forEach(e => {
        // Randomize status
        const isPresent = Math.random() > 0.1; 
        records.push({
          employeeId: e.id,
          name: e.name,
          date: date,
          status: isPresent ? 'Present' : 'Absent',
          checkIn: isPresent ? '09:00 AM' : '-',
          checkOut: isPresent ? '06:00 PM' : '-'
        });
      });
    });
    await Attendance.insertMany(records);
    console.log("✅ Attendance history generated");
  }
}