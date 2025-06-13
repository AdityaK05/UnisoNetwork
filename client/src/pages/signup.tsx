import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../appwrite/auth';

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        try {
            await authService.createAccount(email, password, name);
            navigate('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Signup failed due to an unknown error.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Create Account 🚀</h2>
                <p className="text-gray-500 mb-6">Join the UNiSO community today</p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleSignup} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full hover:opacity-90 transition"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
