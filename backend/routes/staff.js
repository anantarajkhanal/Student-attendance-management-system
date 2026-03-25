const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Student = require('../clusters/student');
const Staff = require('../clusters/staff');
const Class = require('../clusters/class');

const isValidId = id => mongoose.Types.ObjectId.isValid(String(id));

router.get('/classes/:staffId', async (req, res) => {
  try {
    const staffId = req.params.staffId;
    if (!mongoose.Types.ObjectId.isValid(staffId)) 
      return res.status(400).json({ success: false, message: 'Invalid staff id' });

    // Find staff and populate the class ObjectIds
    const staff = await Staff.findById(staffId).populate('assignedClasses.class', 'className department year');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    if (!staff.assignedClasses.length) 
      return res.json({ success: true, classes: [] });

    // Map the classes for frontend
    const classes = staff.assignedClasses.map(a => ({
      className: a.class.className,
      department: a.class.department,
      year: a.class.year,
      subject: a.subject
    }));

    res.json({ success: true, classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/attendance/:studentId', async (req, res) => {
  try {
    let studentId = req.params.studentId;
    if (!mongoose.Types.ObjectId.isValid(studentId))
      return res.status(400).json({ success: false, message: 'Invalid student id' });

    const student = await Student.findById(studentId).select('attendance');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, attendance: student.attendance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/students/all/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const cls = await Class.findOne({ className });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    // Find all students in this class
    const students = await Student.find({ class: cls._id }).select('name rollNum attendance');

    // Calculate attendance % per student
    const studentsWithPercentage = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === 'Present').length;
      const attendancePercentage = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        _id: s._id,
        name: s.name,
        rollNum: s.rollNum,
        attendancePercentage
      };
    });

    res.json({ success: true, students: studentsWithPercentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/student-full-attendance/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId))
      return res.status(400).json({ success: false, message: 'Invalid student id' });

    const student = await Student.findById(studentId)
      .select('name rollNum attendance');

    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({
      success: true,
      student: {
        name: student.name,
        rollNum: student.rollNum,
        attendance: student.attendance
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.post('/mark-attendance', async (req, res) => {
  try {
    const { className, date, subject, attendanceList } = req.body;

    if (!className || !date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ success:false, message:'Invalid payload' });
    }

    const cls = await Class.findOne({ className });
    if (!cls) return res.status(404).json({ success:false, message:'Class not found' });

    const isoDate = new Date(date).toISOString();
    const checkDate = new Date(isoDate).toDateString();


    const anyStudent = await Student.findOne({
      class: cls._id,
      attendance: {
        $elemMatch: {
          subject: subject || 'General',
          date: {
            $gte: new Date(checkDate),
            $lt: new Date(new Date(checkDate).getTime() + 86400000)
          }
        }
      }
    });

    if (anyStudent) {
      return res.json({
        success: false,
        alreadyMarked: true,
        message: 'Attendance already marked for today'
      });
    }

    for (const att of attendanceList) {
      const student = await Student.findById(att.studentId);
      if (!student) continue;

      student.attendance.push({
        date: isoDate,
        subject: subject || 'General',
        status: att.status
      });

      await student.save();
    }

    res.json({ success:true, message:'Attendance recorded successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, error: err.message });
  }
});

module.exports = router;
