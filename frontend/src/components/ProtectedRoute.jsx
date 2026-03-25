import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {

    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');

   
    if (!user || !role) {
        
        return <Navigate to="/" replace />;
    }

   
    if (allowedRole && role !== allowedRole) {
        if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        if (role === 'staff') return <Navigate to="/staff-dashboard" replace />;
        if (role === 'student') return <Navigate to="/student-dashboard" replace />;
    }

  
    return children;
};

export default ProtectedRoute;