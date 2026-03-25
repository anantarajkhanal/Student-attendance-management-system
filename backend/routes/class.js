
const express = require('express');
const router = express.Router();
const Student = require('../clusters/student');
const Class = require('../clusters/class');

router.post('/assign-students', async (req, res) => {
  try {
    const { className, studentIds } = req.body;

    // 1. Find the class
    const classDoc = await Class.findOne({ className });
    if (!classDoc) return res.status(404).json({ success: false, error: 'Class not found' });

    // 2. Update students
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { class: classDoc._id } }
    );

    res.json({ success: true, message: 'Students assigned to class!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
