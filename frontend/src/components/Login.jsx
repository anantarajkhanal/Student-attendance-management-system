import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import studentAvatar from '../assets/student.jpg';
import staffAvatar from '../assets/staff.jpg';
import adminAvatar from '../assets/admin.jpg';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [selectedRole, setSelectedRole] = useState('student');
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const container = document.querySelector('.login-container');
        if (selectedRole === 'student') container.style.backgroundImage = `url(${studentAvatar})`;
        if (selectedRole === 'staff') container.style.backgroundImage = `url(${staffAvatar})`;
        if (selectedRole === 'admin') container.style.backgroundImage = `url(${adminAvatar})`;
    }, [selectedRole]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    role: selectedRole
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return alert(data.message || "Login failed");
            }

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("role", data.user.role);

            if (data.user.role === "admin") navigate("/admin-dashboard");
            else if (data.user.role === "staff") navigate("/staff-dashboard");
            else navigate("/student-dashboard");

        } catch (error) {
            alert("Server error");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>{import.meta.env.VITE_APP_NAME} Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Role:</label>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Password:</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="login-btn">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;