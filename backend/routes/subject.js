const express = require('express');
const router = express.Router();
const Subject = require('../clusters/subject');

router.post('/create', async (req, res) => {
  try {
    const { name, className } = req.body;
    const subject = new Subject({ name, className });
    await subject.save();
    res.json({ success: true, subject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:className', async (req, res) => {
  try {
    const subjects = await Subject.find({ className: req.params.className });
    res.json({ success: true, subjects: subjects.map(s => s.name) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
