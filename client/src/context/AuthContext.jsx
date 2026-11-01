import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API_URL } from '../lib/apiUrl';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profileComplete, setProfileComplete] = useState(null);
    const [loading, setLoading] = useState(true);

    async function checkProfile(currentSession) {
        if (!currentSession) {
            setProfileComplete(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/profiles/me`, {
                headers: { Authorization: `Bearer ${currentSession.access_token}` }
            });

            if (!res.ok) {
                setProfileComplete(false);
                return;
            }

            const profile = await res.json();
            setProfileComplete(Boolean(profile.name && profile.year && profile.major));
        } catch (err) {
            setProfileComplete(false);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            setSession(data.session);
            await checkProfile(data.session);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            await checkProfile(newSession);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, profileComplete, refreshProfileStatus: () => checkProfile(session) }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}