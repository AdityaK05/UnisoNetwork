import React, { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Link, useLocation } from 'wouter';
import authService from '../services/auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [, setLocation] = useLocation();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        try {
            const response = await authService.login({ email, password });
            
            // Use login function from AuthContext
            login(response.user, response.token);
            
            // Redirect to home
            setLocation('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed due to an unknown error.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back 👋</h2>
                <p className="text-gray-500 mb-6">Login to your UNiSO account</p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition"
                    >
                        Login
                    </button>
                </form>

                <p className="text-sm text-gray-500 mt-6">
                    Don’t have an account?{' '}
                    <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
