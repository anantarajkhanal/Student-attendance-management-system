const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNum: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  attendance: [{
    date: { type: Date },
    subject: { type: String },
    status: { type: String }
  }]
});

module.exports = mongoose.model('Student', studentSchema);
