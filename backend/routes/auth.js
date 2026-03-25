const express = require('express');
const router = express.Router();


const Student = require('../clusters/student');
const Staff = require('../clusters/staff');
const Admin = require('../clusters/admin');


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await Admin.findOne({ email });
        let role = "admin";

        if (!user) {
            user = await Staff.findOne({ email });
            role = "staff";
        }

        if (!user) {
            user = await Student.findOne({ email });
            role = "student";
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "No user found" });
        }

        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Wrong password" });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                role,         
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});



module.exports = router;