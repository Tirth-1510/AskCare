import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import robotImg from '../assets/robot.jpg';

// SVG Icons
const EnvelopeIcon = () => (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
);

const GoogleIcon = ({ className = "w-4 h-4", fill = "currentColor" }) => (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
);

const AppleIcon = ({ className = "w-4 h-4", fill = "currentColor" }) => (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.79 17.25 4.04 11.5 6.07 8.05c1.01-1.72 2.62-2.76 4.35-2.73 1.3.02 2.3.69 3.05.69.75 0 2-.79 3.52-.63 1.6.17 2.82.78 3.51 1.84-3.2 1.92-2.4 6.22.8 7.51-1.3 3.3-2.96 6.55-4.25 5.55zM15.03 2.43c.82-1 1.34-2.4 1.12-3.43-1 .09-2.25.75-2.96 1.57-.62.72-1.17 2.12-.92 3.12 1.12.09 2.1-.56 2.76-1.26z" />
    </svg>
);

const FacebookIcon = ({ className = "w-4 h-4", fill = "currentColor" }) => (
    <svg className={className} viewBox="0 0 24 24" fill={fill}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
);

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginOTP, verifyLoginOTP, resendOTP, isAuthenticated, loading: authLoading } = useAuth();

    // Navigation / View states: 'login' | 'register' | 'otp_verify'
    const [authMode, setAuthMode] = useState('login');
    // Login method: 'password' | 'otp'
    const [loginMethod, setLoginMethod] = useState('password');

    // Form input fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // Settings/UX States
    const [passVisible, setPassVisible] = useState(false);
    const [terms, setTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [otpPurpose, setOtpPurpose] = useState('login'); // 'register' | 'login'
    const [notification, setNotification] = useState(null);

    // Redirect to chat if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from || { pathname: '/chat' };
            navigate(from.pathname, { state: from.state, replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Resend code countdown timer
    useEffect(() => {
        let timer;
        if (countdown > 0 && authMode === 'otp_verify') {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown, authMode]);

    const triggerNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, 4500);
    };

    // 1. Submit Registration Form (redirects to Register page in case they ended up here)
    const handleRegister = (e) => {
        e.preventDefault();
        navigate('/register', { state: location.state });
    };

    // 2. Submit Verification Code (OTP) for Registration/Login
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            triggerNotification('Please enter a valid 6-digit passcode', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await verifyLoginOTP(email, otp);
            if (res.success) {
                triggerNotification(res.message || 'Verification successful! Logged in.');
                const from = location.state?.from || { pathname: '/chat' };
                navigate(from.pathname, { state: from.state, replace: true });
            } else {
                triggerNotification(res.message || 'Invalid or expired OTP', 'error');
            }
        } catch (error) {
            triggerNotification(error.message || 'Verification failed. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 3. Submit Login Form (handles both Password & OTP requests)
    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            triggerNotification('Please enter your email', 'error');
            return;
        }

        if (loginMethod === 'password') {
            if (!password) {
                triggerNotification('Please enter your password', 'error');
                return;
            }

            setLoading(true);
            try {
                const res = await login(email, password);
                if (res.success) {
                    triggerNotification(res.message || 'Logged in successfully!');
                    const from = location.state?.from || { pathname: '/chat' };
                    navigate(from.pathname, { state: from.state, replace: true });
                } else {
                    triggerNotification(res.message || 'Login failed', 'error');
                }
            } catch (error) {
                triggerNotification(error.message || 'Authentication failed. Please check credentials.', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // OTP passwordless login request
            setLoading(true);
            try {
                const res = await loginOTP(email);
                if (res.success) {
                    setOtpPurpose('login');
                    setOtp('');
                    setAuthMode('otp_verify');
                    setCountdown(30);
                    triggerNotification(res.message || 'OTP code sent for secure login.');
                } else {
                    triggerNotification(res.message || 'Failed to send OTP code', 'error');
                }
            } catch (error) {
                triggerNotification(error.message || 'Failed to request OTP code', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // 4. Request OTP Resend
    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setLoading(true);
        try {
            const res = await resendOTP(email, 'login');
            if (res.success) {
                setCountdown(30);
                triggerNotification(res.message || 'New OTP passcode sent!');
            } else {
                triggerNotification(res.message || 'Failed to resend code', 'error');
            }
        } catch (error) {
            triggerNotification(error.message || 'Failed to resend code', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Shared Desktop Form Content
    const renderDesktopForm = () => {
        if (authMode === 'otp_verify') {
            return (
                <div className="w-full h-full bg-brand-bg-dark text-white flex flex-col justify-center px-6 py-8 md:px-12 lg:px-16 overflow-y-auto">
                    <div className="max-w-md w-full mx-auto">
                        <h2 className="text-3xl font-extrabold text-white tracking-wide mb-1.5 font-sans">
                            Enter Passcode
                        </h2>
                        <p className="text-xs text-gray-400 mb-8 font-light font-sans">
                            We've sent a 6-digit security code to <strong className="text-brand-neon">{email}</strong>.
                        </p>

                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div className="relative">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="------"
                                    className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-4 text-center tracking-[12px] text-lg font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                    <LockIcon />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-neon text-black font-extrabold py-3.5 rounded-xl hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 text-sm cursor-pointer shadow-lg shadow-brand-neon/10 mt-6 font-sans"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-2 mt-6 text-xs text-gray-400 font-sans">
                            {countdown > 0 ? (
                                <span>Resend passcode in <strong className="text-gray-300 font-semibold">{countdown}s</strong></span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-brand-neon font-semibold hover:underline cursor-pointer"
                                >
                                    Resend Code
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setAuthMode('login')}
                                className="text-gray-500 hover:text-gray-300 hover:underline mt-4 cursor-pointer"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const isRegister = authMode === 'register';
        return (
            <div className="w-full h-full bg-brand-bg-dark text-white flex flex-col justify-center px-6 py-8 md:px-12 lg:px-16 overflow-y-auto">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-wide text-center md:text-left mb-1.5 font-sans">
                        {isRegister ? 'AI Assist Registration' : 'AI Assist'}
                    </h2>
                    <p className="text-xs text-gray-400 text-center md:text-left mb-8 font-light font-sans">
                        {isRegister ? 'Create an account to meet your new AI Bestie.' : 'Chat, Connect, Cherish - Your AI Bestie Awaits.'}
                    </p>

                    <form onSubmit={isRegister ? handleRegister : handleLoginSubmit} className="space-y-4">
                        {/* Name Input (Register Only) */}
                        {isRegister && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Input your name"
                                    className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200 font-sans"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                    <UserIcon />
                                </div>
                            </div>
                        )}

                        {/* Email input */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Input your email"
                                className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200 font-sans"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <EnvelopeIcon />
                            </div>
                        </div>

                        {/* Password input (Register or Password Login) */}
                        {(isRegister || (!isRegister && loginMethod === 'password')) && (
                            <div className="relative">
                                <input
                                    type={passVisible ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 transition-all duration-200 font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPassVisible(!passVisible)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer select-none"
                                >
                                    {passVisible ? <EyeIcon /> : <EyeSlashIcon />}
                                </button>
                            </div>
                        )}

                        {/* Checkbox and Forgot/OTP Toggles */}
                        <div className="flex items-center justify-between text-xs mt-5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={terms}
                                    onChange={(e) => setTerms(e.target.checked)}
                                    className="hidden"
                                />
                                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${terms ? 'bg-brand-neon border-brand-neon text-black' : 'border-brand-neon bg-transparent'}`}>
                                    {terms && (
                                        <svg className="w-3 h-3 fill-current font-bold" viewBox="0 0 20 20">
                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                        </svg>
                                    )}
                                </span>
                                <span className="text-gray-300 text-[11px] md:text-xs font-sans">I agree to the terms and conditions</span>
                            </label>

                            {!isRegister && loginMethod === 'password' && (
                                <a href="#forgot" className="text-brand-neon text-[11px] md:text-xs font-semibold hover:underline font-sans">
                                    Forgot Password?
                                </a>
                            )}
                        </div>

                        {/* Login Method Toggle (Login Only) */}
                        {!isRegister && (
                            <div className="text-right mt-1.5">
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
                                    className="text-brand-neon text-[11px] md:text-xs font-semibold hover:underline font-sans"
                                >
                                    {loginMethod === 'password' ? 'Login with Email OTP' : 'Login with Password'}
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-neon text-black font-extrabold py-3.5 rounded-xl hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200 text-sm cursor-pointer shadow-lg shadow-brand-neon/10 mt-6 font-sans"
                        >
                            {loading
                                ? 'Processing...'
                                : isRegister
                                    ? 'Register & Send OTP'
                                    : loginMethod === 'password'
                                        ? 'Login'
                                        : 'Send Login OTP'
                            }
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6 text-xs text-gray-500 font-sans">
                        <div className="flex-grow border-t border-gray-800"></div>
                        <span className="px-3 text-[11px] text-gray-400 font-light">Or continue with</span>
                        <div className="flex-grow border-t border-gray-800"></div>
                    </div>

                    {/* Social Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => triggerNotification('Google Sign-In Initiated')}
                            className="w-1/2 bg-brand-neon text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer font-sans"
                        >
                            <GoogleIcon fill="#000000" className="w-3.5 h-3.5" />
                            <span>Google</span>
                        </button>
                        <button
                            onClick={() => triggerNotification('Facebook Sign-In Initiated')}
                            className="w-1/2 bg-brand-neon text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer font-sans"
                        >
                            <FacebookIcon fill="#000000" className="w-3.5 h-3.5" />
                            <span>Facebook</span>
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-xs text-gray-500 mt-8 font-light font-sans">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register', { state: location.state })}
                            className="text-brand-neon font-semibold hover:underline ml-1 cursor-pointer bg-transparent border-none p-0"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        );
    };

    // Shared Mobile Form Content
    const renderMobileForm = () => {
        if (authMode === 'otp_verify') {
            return (
                <div className="w-full h-full bg-[#16181F] text-white flex flex-col justify-start px-5 py-8 overflow-y-auto rounded-t-3xl md:rounded-t-none">
                    <div className="w-full max-w-sm mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-1 text-white font-sans">Enter Passcode</h2>
                        <p className="text-[10px] text-center text-gray-400 mb-6 font-light font-sans">
                            We've sent a 6-digit security code to <strong className="text-brand-neon">{email}</strong>.
                        </p>

                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="------"
                                    className="w-full bg-[#20232C] border border-gray-800/80 rounded-xl px-4 py-3.5 text-center tracking-[10px] text-base font-mono text-white placeholder-gray-600 focus:outline-none focus:border-brand-neon transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <LockIcon />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-brand-neon text-black font-extrabold py-3 rounded-xl hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all text-xs cursor-pointer shadow-lg shadow-brand-neon/10 mt-5 font-sans"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-2 mt-6 text-[11px] text-gray-400 font-sans">
                            {countdown > 0 ? (
                                <span>Resend passcode in <strong className="text-gray-300 font-semibold">{countdown}s</strong></span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                    className="text-brand-neon font-semibold hover:underline cursor-pointer"
                                >
                                    Resend Code
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setAuthMode('login')}
                                className="text-gray-500 hover:text-gray-300 hover:underline mt-4 cursor-pointer"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const isRegister = authMode === 'register';
        return (
            <div className="w-full h-full bg-[#16181F] text-white flex flex-col justify-start px-5 py-8 overflow-y-auto rounded-t-3xl md:rounded-t-none">
                <div className="w-full max-w-sm mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-1 text-white font-sans">
                        {isRegister ? 'AI Assist Registration' : 'AI Assist'}
                    </h2>
                    <p className="text-[10px] text-center text-gray-400 mb-6 font-light font-sans">
                        {isRegister ? 'Create an account to meet your new AI Bestie.' : 'Chat, Connect, Cherish - Your AI Bestie Awaits.'}
                    </p>

                    <form onSubmit={isRegister ? handleRegister : handleLoginSubmit} className="space-y-3.5">
                        {/* Name input (Register Only) */}
                        {isRegister && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Input your name"
                                    className="w-full bg-[#20232C] border border-gray-800/80 rounded-xl px-4 py-3 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon transition-all font-sans"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <UserIcon />
                                </div>
                            </div>
                        )}

                        {/* Email input */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Input your email"
                                className="w-full bg-[#20232C] border border-gray-800/80 rounded-xl px-4 py-3 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon transition-all font-sans"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <EnvelopeIcon />
                            </div>
                        </div>

                        {/* Password input (Register or Password Login) */}
                        {(isRegister || (!isRegister && loginMethod === 'password')) && (
                            <div className="relative">
                                <input
                                    type={passVisible ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full bg-[#20232C] border border-gray-800/80 rounded-xl px-4 py-3 pr-12 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-neon transition-all font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPassVisible(!passVisible)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center select-none font-sans"
                                >
                                    {passVisible ? <EyeIcon /> : <EyeSlashIcon />}
                                </button>
                            </div>
                        )}

                        {/* Checkbox (terms and conditions) */}
                        <div className="flex items-center text-xs mt-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={terms}
                                    onChange={(e) => setTerms(e.target.checked)}
                                    className="hidden"
                                />
                                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${terms ? 'bg-brand-neon border-brand-neon text-black' : 'border-brand-neon bg-transparent'}`}>
                                    {terms && (
                                        <svg className="w-3 h-3 fill-current font-bold" viewBox="0 0 20 20">
                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                        </svg>
                                    )}
                                </span>
                                <span className="text-gray-300 text-[11px] font-sans">I agree to the terms and conditions</span>
                            </label>
                        </div>

                        {/* Login Method Toggle (Login Only) */}
                        {!isRegister && (
                            <div className="text-right mt-1">
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
                                    className="text-brand-neon text-[10px] font-semibold hover:underline font-sans"
                                >
                                    {loginMethod === 'password' ? 'Login with Email OTP' : 'Login with Password'}
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-neon text-black font-extrabold py-3 rounded-xl hover:bg-[#c6f000] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all text-xs cursor-pointer shadow-lg shadow-brand-neon/10 mt-5 font-sans"
                        >
                            {loading
                                ? 'Processing...'
                                : isRegister
                                    ? 'Register & Send OTP'
                                    : loginMethod === 'password'
                                        ? 'Login'
                                        : 'Send Login OTP'
                            }
                        </button>
                    </form>

                    {/* Stacked Social Buttons */}
                    <div className="space-y-2 mt-5">
                        <button
                            onClick={() => triggerNotification('Google Sign-In Initiated')}
                            className="w-full bg-[#111317] hover:bg-[#161920] border border-[#20232C]/60 text-gray-300 font-medium py-2 px-3 rounded-xl flex items-center justify-start gap-4 text-xs transition-all cursor-pointer font-sans"
                        >
                            <div className="w-7 h-7 rounded-full bg-brand-neon flex items-center justify-center text-black shrink-0">
                                <GoogleIcon fill="#000000" className="w-3 h-3" />
                            </div>
                            <span>Continue with Google</span>
                        </button>

                        <button
                            onClick={() => triggerNotification('Apple Sign-In Initiated')}
                            className="w-full bg-[#111317] hover:bg-[#161920] border border-[#20232C]/60 text-gray-300 font-medium py-2 px-3 rounded-xl flex items-center justify-start gap-4 text-xs transition-all cursor-pointer font-sans"
                        >
                            <div className="w-7 h-7 rounded-full bg-brand-neon flex items-center justify-center text-black shrink-0">
                                <AppleIcon fill="#000000" className="w-3.5 h-3.5" />
                            </div>
                            <span>Continue with Apple</span>
                        </button>

                        <button
                            onClick={() => triggerNotification('Facebook Sign-In Initiated')}
                            className="w-full bg-[#111317] hover:bg-[#161920] border border-[#20232C]/60 text-gray-300 font-medium py-2 px-3 rounded-xl flex items-center justify-start gap-4 text-xs transition-all cursor-pointer font-sans"
                        >
                            <div className="w-7 h-7 rounded-full bg-brand-neon flex items-center justify-center text-black shrink-0">
                                <FacebookIcon fill="#000000" className="w-3 h-3" />
                            </div>
                            <span>Continue with Facebook</span>
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center text-[11px] text-gray-500 mt-5 font-light font-sans">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register', { state: location.state })}
                            className="text-brand-neon font-semibold hover:underline ml-1 cursor-pointer bg-transparent border-none p-0"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-[#1E1E1F] flex items-center justify-center py-8 px-4 font-sans select-none relative">

            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-3 animate-fade-in border border-opacity-20 ${notification.type === 'error'
                    ? 'bg-red-950 border-red-500 text-red-200'
                    : 'bg-green-950 border-green-500 text-green-200'
                    }`}>
                    {notification.type === 'error' ? (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {notification.message}
                </div>
            )}

            {/* Main Display Frame */}
            <div className="w-full max-w-5xl bg-[#0B0E14] rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80 flex flex-col md:flex-row min-h-[580px] my-auto">
                {/* Left panel: Purple Robot. Hidden on mobile, shown on md and above */}
                <div className="hidden md:flex md:w-1/2 bg-brand-bg-purple flex-col justify-between p-8 relative overflow-hidden select-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#4c3cc2]/10 blur-[120px] pointer-events-none"></div>

                    <div className="flex-grow flex items-center justify-center">
                        <div className="relative w-80 h-80 animate-float">
                            <img
                                src={robotImg}
                                alt="AskCare AI Assist"
                                className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(33,26,88,0.5)]"
                            />
                        </div>
                    </div>

                </div>

                {/* Right panel / Form panel */}
                <div className="w-full md:w-1/2 flex flex-col min-h-[500px]">
                    {/* Show mobile name-inclusive form layout on mobile, and desktop dual-input form layout on desktop */}
                    <div className="block md:hidden h-full">
                        {renderMobileForm()}
                    </div>
                    <div className="hidden md:block h-full">
                        {renderDesktopForm()}
                    </div>
                </div>
            </div>

            {/* Floating animations definitions in style block */}
            <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
}

export default Login;
