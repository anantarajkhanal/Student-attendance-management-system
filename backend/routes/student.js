const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Student = require('../clusters/student');
const Class = require('../clusters/class');

// --- Get a single student's attendance ---
router.get('/attendance/:studentId', async (req, res) => {
  try {
    let studentId = req.params.studentId;
    if (typeof studentId === 'object' && studentId.$oid) studentId = studentId.$oid;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    const student = await Student.findById(studentId).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, className: student.className, attendance: student.attendance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Get a student's profile ---
router.get('/profile/:studentId', async (req, res) => {
  try {
    let studentId = req.params.studentId;
    if (typeof studentId === 'object' && studentId.$oid) studentId = studentId.$oid;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    const student = await Student.findById(studentId).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Get class subjects ---
router.get('/:className', async (req, res) => {
  try {
    const cls = await Class.findOne({ className: req.params.className });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    res.json({ success: true, subjects: cls.subjects || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Get student's class ---
router.get('/my-class/:studentId', async (req, res) => {
  try {
    let studentId = req.params.studentId;
    if (!mongoose.Types.ObjectId.isValid(studentId))
      return res.status(400).json({ success: false, message: 'Invalid student id' });

    const student = await Student.findById(studentId).populate('class', 'className subjects');
    if (!student || !student.class)
      return res.json({ success: true, class: null });

    res.json({ success: true, class: student.class });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- NEW: Get all students in a class with attendance percentages ---
router.get('/students-with-attendance/:className', async (req, res) => {
  try {
    const { className } = req.params;

    const cls = await Class.findOne({ className });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const students = await Student.find({ class: cls._id }).select('-password');

    const result = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === 'Present').length;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        _id: s._id,
        name: s.name,
        rollNum: s.rollNum,
        email: s.email,
        attendancePercentage: percentage
      };
    });




    res.json({ success: true, students: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }



  
});


router.get('/leaderboard/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const cls = await Class.findOne({ className });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const students = await Student.find({ class: cls._id }).select('name rollNum attendance');

    const leaderboard = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === 'Present').length;
      const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
      return { name: s.name, rollNum: s.rollNum, percentage };
    }).sort((a, b) => b.percentage - a.percentage); // descending order

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
