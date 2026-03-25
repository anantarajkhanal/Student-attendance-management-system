const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true },
  department: { type: String },
  year: { type: Number },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
  subjects: [{
    name: { type: String, required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
  }]
});


module.exports = mongoose.models.Class || mongoose.model('Class', classSchema);
