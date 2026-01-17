import './LoginRegister.css';

import React, { useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/admin-login', formData);
            alert(response.data.message);  // Show login result message

            if (response.data.message === 'Login successful') {
                const { role } = response.data;

                // Role-based navigation after successful login
                if (role === 'admin') {
                    navigate('/adminaccount'); // Navigate to admin account
                } else if (role === 'user') {
                    navigate('/useraccount'); // Navigate to user account
                } else {
                    alert('Invalid login type');
                }
            }
        } catch (error) {
            alert('Login failed. Please check your credentials.');
            console.error('Login error:', error);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="wrapper">
            <div className="form-box login">
                <form onSubmit={handleLogin}>
                    <h1>Admin Login</h1>
                    <div className="input-box">
                        <input 
                            type="text" 
                            name="email" 
                            placeholder="Email" 
                            value={formData.email}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="input-box">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            name="password"
                            placeholder="Password" 
                            value={formData.password}
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" onChange={toggleShowPassword} /> Show Password
                        </label>
                        <a href="##">Forgot Password?</a>
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
