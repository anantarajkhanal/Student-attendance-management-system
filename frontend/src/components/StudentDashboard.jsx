import { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const StudentDashboard = () => {
  const rawUser = localStorage.getItem('user');
  let parsedUser = null;
  try { parsedUser = rawUser ? JSON.parse(rawUser) : null; } catch {}

  const studentId = parsedUser?._id?.$oid || parsedUser?._id || parsedUser?.id || null;

  const [studentClass, setStudentClass] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceFilter, setAttendanceFilter] = useState('All');

  const totalClasses = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const presentPercentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);

  const filteredAttendance =
    attendanceFilter === 'All'
      ? attendance
      : attendance.filter(a => a.status === attendanceFilter);

  useEffect(() => {
    if (!studentId) return;

    const fetchClassAndAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/student/my-class/${studentId}`);
        if (res.data?.success) {
          setStudentClass(res.data.class || null);

          if (res.data.class) {
            const studentRes = await axios.get(`http://localhost:5000/api/student/attendance/${studentId}`);
            if (studentRes.data?.success) {
              setAttendance(studentRes.data.attendance || []);
            }

            const leaderboardRes = await axios.get(`http://localhost:5000/api/student/leaderboard/${res.data.class.className}`);
            if (leaderboardRes.data?.success) {
              setLeaderboard(leaderboardRes.data.leaderboard || []);
            }
          }
        } else {
          setStudentClass(null);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchClassAndAttendance();
  }, [studentId]);

  if (!parsedUser) return (
    <div className="dashboard-container">
      <div className="card">Please login as student</div>
    </div>
  );

  if (loading) return (
    <div className="dashboard-container">
      <div className="card">Loading...</div>
    </div>
  );

  if (!studentClass) return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <button className="btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</button>
      </div>
      <div className="card">You are not assigned to any class.</div>
    </div>
  );

  return (
    <div className="dashboard-container">

      {error && <div className="notification">{error}</div>}

      <div className="dashboard-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
        <h2>Hello, {parsedUser?.name || 'Student'}</h2>
        {parsedUser?.email && <h3>Email: {parsedUser.email}</h3>}
        <h3>Class: {studentClass.className}</h3>
        <button className="btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</button>
      </div>

      {/* Attendance Summary */}
      <div className="card attendance-summary">
        <div className="stats">
          <div className="stat-box present">
            <h4>Present</h4>
            <p>{presentCount}</p>
          </div>
          <div className="stat-box absent">
            <h4>Absent</h4>
            <p>{absentCount}</p>
          </div>
          <div className="stat-box percentage">
            <h4>Attendance</h4>
            <p>{presentPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <h3>Attendance Records</h3>

        <div className="attendance-filter">
          <label>Filter:</label>
          <select value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        {filteredAttendance.length === 0 ? (
          <p>No attendance records.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td className={a.status === 'Absent' ? 'absent-text' : 'present-text'}>
                    {a.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Attendance Leaderboard */}
      <div className="card">
        <h3>Attendance Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p>No leaderboard data available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((s, index) => (
                <tr key={s.rollNum} style={s.rollNum === parsedUser.rollNum ? { fontWeight: 'bold', backgroundColor: '#f0f8ff' } : {}}>
                  <td>{index + 1}</td>
                  <td>{s.rollNum}</td>
                  <td>{s.name}</td>
                  <td>{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;