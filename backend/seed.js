const mongoose = require('mongoose');
const Student = require('./clusters/student');

const DB_URI = "mongodb+srv://ananta5421_db_user:sZL4GfzPTrEqSwU4@cluster0.nojdvlw.mongodb.net/attendance_db";

mongoose.connect(DB_URI)  // no options needed
  .then(() => {
    console.log('Connected to MongoDB');
    seedAttendance();
  })
  .catch(err => console.error(err));

async function seedAttendance() {
  try {
    const studentId = "69529ca0bb5797cae1a26d50"; 

    const attendanceEntries = [
      { date: new Date('2025-12-01'), subject: 'Math', status: 'Present' },
      { date: new Date('2025-12-02'), subject: 'Math', status: 'Absent' },
      { date: new Date('2025-12-03'), subject: 'Science', status: 'Present' },
      { date: new Date('2025-12-04'), subject: 'Science', status: 'Absent' },
    ];

    const result = await Student.updateOne(
      { _id: studentId },
      { $push: { attendance: { $each: attendanceEntries } } }
    );

    console.log('Attendance updated:', result);
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}
