import { useState, useEffect } from 'react';
import API from '../api';
import './Dashboard.css';

const StaffDashboard = () => {
  const rawUser = localStorage.getItem('user');
  let parsedUser = null;
  try { parsedUser = rawUser ? JSON.parse(rawUser) : null; } catch {}

  const staffId = parsedUser?._id?.$oid || parsedUser?._id || parsedUser?.id || null;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');
  const [viewMode, setViewMode] = useState('mark');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const notify = (msg, timeout = 3000) => {
    setNotification(msg);
    if (timeout > 0) setTimeout(() => setNotification(''), timeout);
  };

  // Fetch classes
  useEffect(() => {
    if (!staffId) return;
    setLoadingClasses(true);
    setError(null);

    API.get(`/api/staff/classes/${staffId}`)
      .then(res => setClasses(res.data?.classes || []))
      .catch(() => {
        setError('Failed to load classes');
        notify('Failed to load classes');
      })
      .finally(() => setLoadingClasses(false));
  }, [staffId]);

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendanceData({});
      return;
    }

    setLoadingStudents(true);

    API.get(`/api/staff/students/all/${selectedClass}`)
      .then(res => {
        const studentsList = res.data?.students || [];
        setStudents(studentsList);

        const initial = {};
        studentsList.forEach(s => {
          initial[s._id] = 'Absent';
        });
        setAttendanceData(initial);
      })
      .catch(() => {
        setStudents([]);
        notify('Failed to load students');
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  const handleAttendanceChange = (id, status) =>
    setAttendanceData(prev => ({ ...prev, [id]: status }));

  const submitAttendance = async () => {
    if (!selectedClass) return notify('Select a class');
    if (!students.length) return notify('No students');

    const date = new Date().toISOString().split('T')[0];
    const attendanceList = students.map(s => ({
      studentId: s._id,
      status: attendanceData[s._id] || 'Absent'
    }));

    try {
      const res = await API.post(`/api/staff/mark-attendance`, {
        className: selectedClass,
        subject: 'General',
        date,
        attendanceList
      });

      if (res.data?.alreadyMarked) {
        notify('Attendance already marked today');
        return;
      }

      if (res.data?.success) {
        notify('Attendance submitted!');
        const reset = {};
        students.forEach(s => (reset[s._id] = 'Absent'));
        setAttendanceData(reset);

        const updated = await API.get(`/api/staff/students/all/${selectedClass}`);
        setStudents(updated.data?.students || []);
      } else notify('Submit failed');
    } catch {
      notify('Failed to submit attendance');
    }
  };

  if (!parsedUser)
    return <div className="dashboard-container"><div className="card">Please login as staff</div></div>;

  return (
    <div className="dashboard-container">

      {notification && <div className="notification">{notification}</div>}

      <div className="dashboard-header">
        <h2>Welcome, {parsedUser?.name}</h2>
        <p>{parsedUser?.email}</p>

        <div className="dashboard-header-buttons">
          <button className="btn" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Logout</button>
          <button className="btn" onClick={() => { setViewMode(viewMode === 'mark' ? 'view' : 'mark'); setSelectedStudent(null); }}>
            {viewMode === 'mark' ? 'View Attendance' : 'Back to Mark'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Select Class</h3>
        {loadingClasses ? <p>Loading classes...</p> :
          error ? <p style={{ color: 'red' }}>{error}</p> :
          classes.length === 0 ? <p>No classes assigned.</p> :
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(null); }}>
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c.className} value={c.className}>{c.className}</option>)}
          </select>}
      </div>

      {selectedClass && (
        <div className="card" style={{ marginTop: 20 }}>
          {loadingStudents ? <p>Loading students...</p> :
            students.length === 0 ? <p>No students in this class.</p> :

            viewMode === 'mark' ? (
              <>
                <h3>Mark Attendance for {selectedClass}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Name</th>
                      <th>Present</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const status = attendanceData[s._id] || 'Absent';
                      return (
                        <tr key={s._id}>
                          <td>{s.rollNum}</td>
                          <td>{s.name}</td>
                          <td>
                            <button className={status === 'Present' ? 'present-btn active' : 'present-btn'} onClick={() => handleAttendanceChange(s._id, 'Present')}>Present</button>
                          </td>
                          <td>
                            <button className={status === 'Absent' ? 'absent-btn active' : 'absent-btn'} onClick={() => handleAttendanceChange(s._id, 'Absent')}>Absent</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <button className="btn" style={{ marginTop: 15 }} onClick={submitAttendance}>Submit Attendance</button>
              </>
            ) : (
              <>
                <h3>View Attendance for {selectedClass}</h3>
                {!selectedStudent ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>Name</th>
                        <th>Attendance %</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s._id}>
                          <td>{s.rollNum}</td>
                          <td>{s.name}</td>
                          <td>{s.attendancePercentage}%</td>
                          <td><button className="btn" onClick={async () => {
                            const res = await API.get(`/api/staff/student-full-attendance/${s._id}`);
                            if (res.data?.success) setSelectedStudent(res.data.student);
                          }}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <>
                    <h4>{selectedStudent.name} (Roll: {selectedStudent.rollNum})</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Subject</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.attendance?.map((a, i) => (
                          <tr key={i}>
                            <td>{new Date(a.date).toLocaleDateString()}</td>
                            <td>{a.subject}</td>
                            <td>{a.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button className="btn" onClick={() => setSelectedStudent(null)}>Back to Student List</button>
                  </>
                )}
              </>
            )}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;