import './LoginRegister.css';

import React, {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import RecaptchaComponent from './RecaptchaComponent';

const LoginRegister = () => {
    const [action, setAction] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        employeeID: '',
        firstName: '',
        lastName: '',
        department: ''
    });
    const [recaptchaToken, setRecaptchaToken] = useState(null);
    const navigate = useNavigate();

    const generateRandomEmployeeID = (role) => {
        const prefix = role === 'moderator' ? '3' : '1';
        const randomNumber = Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit random number
        return prefix + randomNumber.slice(1); // Ensure the ID starts with the correct prefix
    };

    useEffect(() => {
        if (action === ' active') {
            setFormData((prevFormData) => ({
                ...prevFormData,
                employeeID: generateRandomEmployeeID(prevFormData.role)
            }));
        }
    }, [action, formData.role]);

    const registerLink = () => {
        setAction(' active');
        setFormData({
            email: formData.email,
            password: '',
            confirmPassword: '',
            role: 'employee',
            employeeID: generateRandomEmployeeID('employee'),
            firstName: '',
            lastName: '',
            department: ''
        });
    };

    const loginLink = () => {
        setAction('');
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            role: 'employee',
            employeeID: '',
            firstName: '',
            lastName: '',
            department: ''
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRecaptchaChange = (token) => {
        setRecaptchaToken(token);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!recaptchaToken) {
            alert('Please complete the reCAPTCHA');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/login', { ...formData, recaptchaToken });
            alert(response.data.message);

            if (response.data.message === 'Login successful') {
                const { token, role } = response.data;
                localStorage.setItem('token', token); // Store the token in localStorage

                if (role === 'employee') {
                    navigate('/useraccount');
                } else if (role === 'moderator') {
                    navigate('/modsaccount');
                } else {
                    alert('Invalid login type');
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert(error.response.data.message);
            } else {
                alert('Login failed');
            }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!recaptchaToken) {
            alert('Please complete the reCAPTCHA');
            return;
        }
        try {
            const response = await axios.post('http://localhost:5000/register', { ...formData, recaptchaToken });
            alert(response.data.message);

            if (response.data.message === 'Registration successful') {
                loginLink();
                navigate('/');
            }
        } catch (error) {
            alert('Registration failed');
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`wrapper${action}`}>
            <div className="form-box login">
                <form onSubmit={handleLogin}>
                    <h1>Employee Login</h1>
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
                        <a href="#">Forgot Password?</a>
                    </div>
                    <RecaptchaComponent onChange={handleRecaptchaChange} />
                    <button type="submit" disabled={!recaptchaToken}>Login</button>
                    <div className="register-link">
                        <p>Don't have an account?
                            <a href="#" onClick={registerLink}> Register</a>
                        </p>
                    </div>
                </form>
            </div>

            <div className="form-box register">
                <form onSubmit={handleRegister}>
                    <h1>Registration</h1>
                    <div className="input-box">
                        <input
                            type="text"
                            name="employeeID"
                            placeholder="Employee ID"
                            value={formData.employeeID}
                            readOnly
                            className="readonly-input"
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="text"
                            name="department"
                            placeholder="Department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <span>Register as:</span>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="employee">Employee</option>
                            <option value="moderator">Moderator</option>
                        </select>
                    </div>
                    <RecaptchaComponent onChange={handleRecaptchaChange} />
                    <button type="submit" disabled={!recaptchaToken}>Register</button>
                    <div className="register-link">
                        <p>Already have an account?
                            <a href="#" onClick={loginLink}> Login</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginRegister;