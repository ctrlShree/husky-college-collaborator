import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const authRequired = location.state?.reason === 'auth-required';

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            return;
        }

        navigate('/browse');
    }

    return (
        <div>
            <h1>Sign in</h1>
            {authRequired && (
                <p className="error-text">Please log in to continue.</p>
            )}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>School email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Sign in</button>
            </form>
        </div>
    );
}