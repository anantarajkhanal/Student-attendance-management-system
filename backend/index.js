const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();
const classRoutes = require('./routes/class');
const subjectRouter = require('./routes/subject');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');

const app = express();


app.use(cors({
    origin: "https://student-attendance-management-syste-eight.vercel.app",
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));

app.use(express.json());



mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.log("DB Error:", err));

app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api', authRoutes);
app.use('/api/class', classRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subject', subjectRouter);

app.listen(process.env.PORT ||5000, () => {
    console.log(`Server running on port ${process.env.PORT||5000}`);
});
