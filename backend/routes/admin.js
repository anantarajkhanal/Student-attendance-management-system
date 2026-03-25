const express = require('express');
const router = express.Router();
const Student = require('../clusters/student');
const Staff = require('../clusters/staff');
const Class = require('../clusters/class');
const mongoose = require('mongoose');

// ---------- STUDENTS ----------

// Add Student
router.post('/add-student', async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();
    res.json({ success: true, message: "Student added successfully" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update Student
router.put('/update-student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (!updates.password) delete updates.password;
    if (updates.classId) {
      updates.class = updates.classId;
      delete updates.classId;
    }
    const updated = await Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('class');
    if (!updated) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, student: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get Students
router.post('/get-student', async (req, res) => {
  try {
    const students = await Student.find().populate('class');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Assign Class to Student
router.post('/assign-student', async (req, res) => {
  const { studentId, classId } = req.body;
  if (!studentId || !classId) return res.status(400).json({ success: false, error: 'Student and Class required' });
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    student.class = classId;
    await student.save();
    const populatedStudent = await student.populate('class');
    res.json({ success: true, message: 'Class assigned to student', student: populatedStudent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- STAFF ----------

// Add Staff
router.post('/add-staff', async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res.json({ success: true, message: "Staff added successfully" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update Staff
router.put('/update-staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (!updates.password) delete updates.password;

    if (updates.assignedClasses) {
      updates.assignedClasses = updates.assignedClasses.map(a => ({ class: a.classId, subject: a.subject }));
    }

    const updated = await Staff.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('assignedClasses.class');
    if (!updated) return res.status(404).json({ success: false, error: 'Staff not found' });
    res.json({ success: true, staff: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get Staff
router.post('/get-staff', async (req, res) => {
  try {
    const staff = await Staff.find().populate('assignedClasses.class');
    res.json({ success: true, staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Assign Class to Staff
router.post('/assign-staff', async (req, res) => {
  const { staffId, classId, subject } = req.body;
  if (!staffId || !classId || !subject) return res.status(400).json({ success: false, error: 'All fields required' });
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff not found' });
    staff.assignedClasses.push({ class: classId, subject });
    await staff.save();
    const populatedStaff = await staff.populate('assignedClasses.class');
    res.json({ success: true, message: 'Class assigned to staff', staff: populatedStaff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- CLASSES ----------

// Create Class
router.post('/add-class', async (req, res) => {
  try {
    const { className, department, year } = req.body;
    const existing = await Class.findOne({ className });
    if (existing) return res.status(400).json({ success: false, error: 'Class already exists' });
    const newClass = new Class({ className, department, year });
    await newClass.save();
    res.json({ success: true, message: 'Class created', class: newClass });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Class
router.put('/update-class/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClass = await Class.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedClass) return res.status(404).json({ success: false, error: 'Class not found' });
    res.json({ success: true, class: updatedClass });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get Classes
router.get('/get-classes', async (req, res) => {
  try {
    const classes = await Class.find();
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Class
router.delete('/delete-class/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Student.updateMany({ class: id }, { $unset: { class: "" } });
    await Class.findByIdAndDelete(id);
    res.json({ success: true, message: 'Class deleted and student references cleared' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete User
router.delete('/delete-user/:role/:id', async (req, res) => {
  try {
    const { role, id } = req.params;
    if (role === 'student') await Student.findByIdAndDelete(id);
    else if (role === 'staff') await Staff.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Attendance of a Student
router.get('/student-attendance/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, error: 'Invalid student id' });
    }

    const student = await Student.findById(id).populate('class', 'className department year');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    return res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        rollNum: student.rollNum,
        class: student.class || null
      },
      attendance: student.attendance || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

module.exports = router;