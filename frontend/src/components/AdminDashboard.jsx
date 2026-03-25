import { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

const AdminDashboard = () => {
  const [student, setStudent] = useState({ name: '', rollNum: '', email: '', password: '', classId: '' });
  const [staff, setStaff] = useState({ name: '', email: '', password: '', assignedClasses: [] });
  const [classForm, setClassForm] = useState({ className: '', department: '', year: '' });

  const [assign, setAssign] = useState({ staffId: '', classId: '', subject: '' });
  const [assignStudent, setAssignStudent] = useState({ studentId: '', classId: '' });

  const [activeSection, setActiveSection] = useState(null);
  const [notification, setNotification] = useState('');
  const [confirmAssign, setConfirmAssign] = useState(null);

  const [studentsList, setStudentsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [classesList, setClassesList] = useState([]);

  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);

  const [studentFilterClass, setStudentFilterClass] = useState('');
  const [staffFilterClass, setStaffFilterClass] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilterClass, setAttendanceFilterClass] = useState('');

  const notify = (msg, timeout = 3000) => {
    setNotification(msg);
    if (timeout > 0) setTimeout(() => setNotification(''), timeout);
  };

  useEffect(() => {
    fetchStudents();
    fetchStaff();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.post('/api/admin/get-student');
      if (res.data?.success) setStudentsList(res.data.students || []);
    } catch (err) {
      notify('Error fetching students');
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await API.post('/api/admin/get-staff');
      if (res.data?.success) setStaffList(res.data.staff || []);
    } catch (err) {
      notify('Error fetching staff');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await API.get('/api/admin/get-classes');
      if (res.data?.success) setClassesList(res.data.classes || []);
    } catch (err) {
      notify('Error fetching classes');
    }
  };

  const handleAddOrUpdateStudent = async e => {
    e.preventDefault();
    try {
      const payload = { name: student.name, rollNum: student.rollNum, email: student.email };
      if (student.password) payload.password = student.password;
      if (student.classId) payload.class = student.classId;

      if (editingStudentId) {
        await API.put(`/api/admin/update-student/${editingStudentId}`, payload);
        notify('Student updated!');
        setEditingStudentId(null);
      } else {
        await API.post('/api/admin/add-student', payload);
        notify('Student added!');
      }

      setStudent({ name: '', rollNum: '', email: '', password: '', classId: '' });
      fetchStudents();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error saving student');
    }
  };

  const handleEditStudent = s => {
    setStudent({
      name: s.name || '',
      rollNum: s.rollNum || '',
      email: s.email || '',
      password: '',
      classId: s.class?._id || s.class || ''
    });
    setEditingStudentId(s._id);
    setActiveSection('student');
  };

  const handleAddOrUpdateStaff = async e => {
    e.preventDefault();
    try {
      const payload = { name: staff.name, email: staff.email };
      if (staff.password) payload.password = staff.password;
      if (Array.isArray(staff.assignedClasses) && staff.assignedClasses.length) {
        payload.assignedClasses = staff.assignedClasses.map(ac => ({ classId: ac.classId, subject: ac.subject }));
      }

      if (editingStaffId) {
        await API.put(`/api/admin/update-staff/${editingStaffId}`, payload);
        notify('Staff updated!');
        setEditingStaffId(null);
      } else {
        await API.post('/api/admin/add-staff', payload);
        notify('Staff added!');
      }

      setStaff({ name: '', email: '', password: '', assignedClasses: [] });
      fetchStaff();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error saving staff');
    }
  };

  const handleEditStaff = s => {
    setStaff({
      name: s.name || '',
      email: s.email || '',
      password: '',
      assignedClasses: (s.assignedClasses || []).map(ac => ({
        classId: ac.class?._id || ac.class,
        subject: ac.subject || ''
      }))
    });
    setEditingStaffId(s._id);
    setActiveSection('staff');
  };

  const addStaffAssignedClass = () =>
    setStaff(prev => ({
      ...prev,
      assignedClasses: [...(prev.assignedClasses || []), { classId: '', subject: '' }]
    }));

  const updateStaffAssignedClass = (idx, key, value) =>
    setStaff(prev => {
      const arr = [...(prev.assignedClasses || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, assignedClasses: arr };
    });

  const removeStaffAssignedClass = idx =>
    setStaff(prev => {
      const arr = [...(prev.assignedClasses || [])];
      arr.splice(idx, 1);
      return { ...prev, assignedClasses: arr };
    });

  const handleAddOrUpdateClass = async e => {
    e.preventDefault();
    const yearStr = String(classForm.year);
    const year = Number(yearStr);

    if (!/^\d{4}$/.test(yearStr) || year < 2010 || year > 2050) {
      notify('Year must be 4 digits and between 2010 and 2050');
      return;
    }

    try {
      if (editingClassId) {
        await API.put(`/api/admin/update-class/${editingClassId}`, classForm);
        notify('Class updated!');
        setEditingClassId(null);
      } else {
        await API.post('/api/admin/add-class', classForm);
        notify('Class created!');
      }

      setClassForm({ className: '', department: '', year: '' });
      fetchClasses();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error saving class');
    }
  };

  const handleEditClass = c => {
    setClassForm({
      className: c.className || '',
      department: c.department || '',
      year: c.year || ''
    });
    setEditingClassId(c._id);
    setActiveSection('createClass');
  };

  const handleDeleteClass = async id => {
    if (!window.confirm('Delete class? This will clear class refs from students.')) return;
    try {
      await API.delete(`/api/admin/delete-class/${id}`);
      notify('Class deleted');
      fetchClasses();
      fetchStudents();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error deleting class');
    }
  };

  const handleDeleteUser = async (role, id) => {
    if (!window.confirm(`Delete ${role}?`)) return;
    try {
      await API.delete(`/api/admin/delete-user/${role}/${id}`);
      notify('Deleted');
      fetchStudents();
      fetchStaff();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error deleting user');
    }
  };

  const handleAssignClass = async e => {
    e.preventDefault();
    if (!assign.staffId || !assign.classId || !assign.subject) {
      notify('All fields required');
      return;
    }

    try {
      await API.post('/api/admin/assign-staff', assign);
      notify('Class assigned to staff!');
      setAssign({ staffId: '', classId: '', subject: '' });
      fetchStaff();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error assigning');
    }
  };

  const assignStudentClass = async () => {
    try {
      await API.post('/api/admin/assign-student', assignStudent);
      notify('Class assigned to student!');
      setAssignStudent({ studentId: '', classId: '' });
      fetchStudents();
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error assigning student');
    } finally {
      setConfirmAssign(null);
    }
  };

  const handleAssignStudent = async e => {
    e.preventDefault();
    if (!assignStudent.studentId || !assignStudent.classId) {
      notify('Select student and class');
      return;
    }

    const studentObj = studentsList.find(s => s._id === assignStudent.studentId);
    const currentClass = studentObj?.class?._id;
    const newClass = classesList.find(c => c._id === assignStudent.classId);

    if (currentClass && currentClass !== assignStudent.classId) {
      setConfirmAssign({ student: studentObj, newClass });
      return;
    }

    await assignStudentClass();
  };

  const viewStudentAttendance = async studentObj => {
    const id = studentObj?._id?.$oid || studentObj?._id;
    if (!id) return notify('Invalid student id');

    setSelectedStudent(studentObj);
    setStudentAttendance([]);

    try {
      const res = await API.get(`/api/admin/student-attendance/${id}`);
      if (res.data?.success) {
        setSelectedStudent(res.data.student || studentObj);
        setStudentAttendance(res.data.attendance || []);
      } else {
        notify(res.data?.error || 'No attendance data');
      }
    } catch (err) {
      notify(err.response?.data?.error || err.message || 'Error fetching attendance');
    }
  };

  const filterStudentsForDisplay = () => {
    return studentsList.filter(s =>
      (!studentFilterClass || s.class?._id === studentFilterClass) &&
      (!studentSearch ||
        (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.rollNum || '').toLowerCase().includes(studentSearch.toLowerCase()))
    );
  };

  const filterStaffForDisplay = () => {
    return staffList.filter(s =>
      (!staffFilterClass || (s.assignedClasses || []).some(a => a.class?._id === staffFilterClass)) &&
      (!staffSearch ||
        (s.name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(staffSearch.toLowerCase()))
    );
  };

  const filterClassesForDisplay = () => {
    return classesList.filter(c =>
      (!classSearch ||
        (c.className || '').toLowerCase().includes(classSearch.toLowerCase()) ||
        (c.department || '').toLowerCase().includes(classSearch.toLowerCase()) ||
        String(c.year || '').includes(classSearch))
    );
  };

  const filteredAttendanceStudents = () => {
    return studentsList.filter(s =>
      (!attendanceFilterClass || s.class?._id === attendanceFilterClass) &&
      (!attendanceSearch ||
        (s.name || '').toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        (s.rollNum || '').toLowerCase().includes(attendanceSearch.toLowerCase()))
    );
  };

  return (
    <div className="dashboard-container">
      {notification && <div className="notification">{notification}</div>}

      {confirmAssign && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm-card">
            <h3>Confirm Class Change</h3>
            <p style={{ marginTop: 6 }}>
              Student <strong>{confirmAssign.student.name}</strong> is already in class
              <strong> {confirmAssign.student.class?.className}</strong>.<br />
              Do you want to change to <strong>{confirmAssign.newClass.className}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '18px', justifyContent: 'center' }}>
              <button className="btn btn-warning" onClick={assignStudentClass} style={{ minWidth: 100 }}>
                Yes
              </button>
              <button className="btn btn-danger" onClick={() => setConfirmAssign(null)} style={{ minWidth: 100 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Hello, Admin</h1>
        <button onClick={() => (window.location.href = '/')} className="btn">Logout</button>
      </div>

      <div className="dashboard-layout">
        <div className="sidebar">
          <h2>Admin Panel</h2>

          <button className="btn" onClick={() => setActiveSection(activeSection === 'student' ? null : 'student')}>
            {editingStudentId ? 'Edit Student' : 'Add Student'}
          </button>

          <button className="btn" onClick={() => setActiveSection(activeSection === 'staff' ? null : 'staff')}>
            {editingStaffId ? 'Edit Staff' : 'Add Staff'}
          </button>

          <button className="btn" onClick={() => setActiveSection(activeSection === 'createClass' ? null : 'createClass')}>
            {editingClassId ? 'Edit Class' : 'Create Class'}
          </button>

          <button className="btn" onClick={() => setActiveSection(activeSection === 'assignClass' ? null : 'assignClass')}>
            Assign Class to Staff
          </button>

          <button className="btn" onClick={() => setActiveSection(activeSection === 'assignStudent' ? null : 'assignStudent')}>
            Assign Class to Student
          </button>

          <button className="btn" onClick={() => { setActiveSection('displayStudent'); fetchStudents(); }}>
            Display Students
          </button>

          <button className="btn" onClick={() => { setActiveSection('displayStaff'); fetchStaff(); }}>
            Display Staff
          </button>

          <button className="btn" onClick={() => { setActiveSection('displayClass'); fetchClasses(); }}>
            Display Classes
          </button>

          <button className="btn" onClick={() => setActiveSection('viewAttendance')}>
            View Attendance
          </button>
        </div>

        <div className="section-grid">
          {activeSection === 'student' && (
            <div className="card">
              <h3>{editingStudentId ? 'Edit Student' : 'Add Student'}</h3>
              <form onSubmit={handleAddOrUpdateStudent}>
                <input placeholder="Name" value={student.name} onChange={e => setStudent({ ...student, name: e.target.value })} required />
                <input placeholder="Roll Number" value={student.rollNum} onChange={e => setStudent({ ...student, rollNum: e.target.value })} required />
                <input placeholder="Email" value={student.email} onChange={e => setStudent({ ...student, email: e.target.value })} required />
                <select value={student.classId} onChange={e => setStudent({ ...student, classId: e.target.value })}>
                  <option value="">-- No class --</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
                <input
                  type="password"
                  placeholder={editingStudentId ? "Leave blank to keep password" : "Password"}
                  value={student.password}
                  onChange={e => setStudent({ ...student, password: e.target.value })}
                />
                <button className="btn" style={{ marginTop: 10 }}>
                  {editingStudentId ? 'Update Student' : 'Add Student'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'staff' && (
            <div className="card">
              <h3>{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h3>
              <form onSubmit={handleAddOrUpdateStaff}>
                <input placeholder="Name" value={staff.name} onChange={e => setStaff({ ...staff, name: e.target.value })} required />
                <input placeholder="Email" value={staff.email} onChange={e => setStaff({ ...staff, email: e.target.value })} required />
                <input
                  type="password"
                  placeholder={editingStaffId ? "Leave blank to keep password" : "Password"}
                  value={staff.password}
                  onChange={e => setStaff({ ...staff, password: e.target.value })}
                />

                <div style={{ marginTop: 10 }}>
                  <strong>Assigned classes</strong>
                  {(staff.assignedClasses || []).map((ac, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <select value={ac.classId} onChange={e => updateStaffAssignedClass(idx, 'classId', e.target.value)} required>
                        <option value="">Select Class</option>
                        {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                      </select>
                      <input placeholder="Subject" value={ac.subject} onChange={e => updateStaffAssignedClass(idx, 'subject', e.target.value)} required />
                      <button type="button" className="btn btn-danger" onClick={() => removeStaffAssignedClass(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn" onClick={addStaffAssignedClass}>
                      Add assigned class
                    </button>
                  </div>
                </div>

                <button className="btn" style={{ marginTop: 12 }}>
                  {editingStaffId ? 'Update Staff' : 'Add Staff'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'createClass' && (
            <div className="card">
              <h3>{editingClassId ? 'Edit Class' : 'Create Class'}</h3>
              <form onSubmit={handleAddOrUpdateClass}>
                <input placeholder="Class Name" value={classForm.className} onChange={e => setClassForm({ ...classForm, className: e.target.value })} required />
                <input placeholder="Department" value={classForm.department} onChange={e => setClassForm({ ...classForm, department: e.target.value })} required />
                <input type="number" placeholder="Year" value={classForm.year} onChange={e => setClassForm({ ...classForm, year: e.target.value })} required />
                <button className="btn" style={{ marginTop: 10 }}>
                  {editingClassId ? 'Update Class' : 'Create Class'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'assignClass' && (
            <div className="card">
              <h3>Assign Class to Staff</h3>
              <form onSubmit={handleAssignClass}>
                <select value={assign.staffId} onChange={e => setAssign({ ...assign, staffId: e.target.value })} required>
                  <option value="">Select Staff</option>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <select value={assign.classId} onChange={e => setAssign({ ...assign, classId: e.target.value })} required>
                  <option value="">Select Class</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
                <input placeholder="Subject" value={assign.subject} onChange={e => setAssign({ ...assign, subject: e.target.value })} required />
                <button className="btn" style={{ marginTop: 8 }}>Assign Class</button>
              </form>
            </div>
          )}

          {activeSection === 'assignStudent' && (
            <div className="card">
              <h3>Assign Class to Student</h3>
              <form onSubmit={handleAssignStudent}>
                <select value={assignStudent.studentId} onChange={e => setAssignStudent({ ...assignStudent, studentId: e.target.value })} required>
                  <option value="">Select Student</option>
                  {studentsList.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNum})</option>)}
                </select>
                <select value={assignStudent.classId} onChange={e => setAssignStudent({ ...assignStudent, classId: e.target.value })} required>
                  <option value="">Select Class</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
                <button className="btn" style={{ marginTop: 8 }}>Assign Class</button>
              </form>
            </div>
          )}

          {activeSection === 'displayStudent' && (
            <div className="card">
              <h3>All Students</h3>
              <div className="filters-container" style={{ marginBottom: 10 }}>
                <input className="filter-input" placeholder="Search by name or roll" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                <select value={studentFilterClass} onChange={e => setStudentFilterClass(e.target.value)}>
                  <option value="">All classes</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Roll</th><th>Email</th><th>Class</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filterStudentsForDisplay().map(s => (
                    <tr key={s._id}>
                      <td>{s._id}</td>
                      <td>{s.name}</td>
                      <td>{s.rollNum}</td>
                      <td>{s.email}</td>
                      <td>{s.class?.className || ''}</td>
                      <td>
                        <button className="btn btn-warning" onClick={() => handleEditStudent(s)} style={{ width: '100%' }}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteUser('student', s._id)} style={{ width: '100%', marginTop: 6 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'displayStaff' && (
            <div className="card">
              <h3>All Staff</h3>
              <div className="filters-container" style={{ marginBottom: 10 }}>
                <input className="filter-input" placeholder="Search by name or email" value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
                <select value={staffFilterClass} onChange={e => setStaffFilterClass(e.target.value)}>
                  <option value="">All classes</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Email</th><th>Assigned Classes</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filterStaffForDisplay().map(s => (
                    <tr key={s._id}>
                      <td>{s._id}</td>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{(s.assignedClasses || []).map(a => `${a.class?.className || a.class} (${a.subject})`).join(', ')}</td>
                      <td>
                        <button className="btn btn-warning" onClick={() => handleEditStaff(s)} style={{ width: '100%' }}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteUser('staff', s._id)} style={{ width: '100%', marginTop: 6 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'displayClass' && (
            <div className="card">
              <h3>All Classes</h3>
              <div className="filters-container" style={{ marginBottom: 10 }}>
                <input className="filter-input" placeholder="Search class name / dept / year" value={classSearch} onChange={e => setClassSearch(e.target.value)} />
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Dept</th><th>Year</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filterClassesForDisplay().map(c => (
                    <tr key={c._id}>
                      <td>{c._id}</td>
                      <td>{c.className}</td>
                      <td>{c.department}</td>
                      <td>{c.year}</td>
                      <td>
                        <button className="btn btn-warning" onClick={() => handleEditClass(c)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteClass(c._id)} style={{ marginLeft: 8 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'viewAttendance' && (
            <div className="card">
              <h3>View Attendance</h3>

              <div className="filters-container" style={{ marginBottom: 10 }}>
                <input className="filter-input" placeholder="Search student by name or roll number" value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)} />
                <select value={attendanceFilterClass} onChange={e => setAttendanceFilterClass(e.target.value)}>
                  <option value="">All Classes</option>
                  {classesList.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
              </div>

              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Roll</th><th>Class</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredAttendanceStudents().map(s => (
                    <tr key={s._id}>
                      <td>{s._id}</td>
                      <td>{s.name}</td>
                      <td>{s.rollNum}</td>
                      <td>{s.class?.className || ''}</td>
                      <td>
                        <button className="btn" style={{ width: '100%' }} onClick={() => viewStudentAttendance(s)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedStudent && (
                <div className="card" style={{ marginTop: 20 }}>
                  <h3>Attendance for {selectedStudent.name} ({selectedStudent.rollNum})</h3>
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Subject</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {studentAttendance.map((a, idx) => (
                        <tr key={idx}>
                          <td>{a.date ? new Date(a.date).toLocaleDateString() : ''}</td>
                          <td>{a.subject}</td>
                          <td style={{ color: a.status === 'present' ? '#f8b500' : '#ff4d6b', fontWeight: 600 }}>
                            {a.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;