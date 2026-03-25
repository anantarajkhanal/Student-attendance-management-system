const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assignedClasses: [
        {
            class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, 
            subject: String    
        }
    ]
});


module.exports = mongoose.model('Staff', staffSchema);