import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [ownedProjects, setOwnedProjects] = useState([]);
    const [memberProjects, setMemberProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { refreshProfileStatus } = useAuth();

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const userId = sessionData.session?.user?.id;

            const [profileRes, ownedRes, memberRes] = await Promise.all([
                fetch('http://127.0.0.1:4000/api/profiles/me', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('http://127.0.0.1:4000/api/projects/mine', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://127.0.0.1:4000/api/projects/member/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (!profileRes.ok) {
                if (!ignore) {
                    setError('Failed to load profile');
                    setLoading(false);
                }
                return;
            }

            const profileData = await profileRes.json();
            const ownedData = await ownedRes.json();
            const memberData = await memberRes.json();

            if (!ignore) {
                setProfile(profileData);
                setOwnedProjects(ownedData);
                setMemberProjects(memberData);
                setLoading(false);
            }
        }

        loadData();

        return () => {
            ignore = true;
        };
    }, []);

    function handleChange(field, value) {
        setProfile((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch('http://127.0.0.1:4000/api/profiles/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: profile.name,
                year: profile.year,
                major: profile.major,
                bio: profile.bio,
                github_url: profile.github_url,
                portfolio_url: profile.portfolio_url,
                linkedin_url: profile.linkedin_url,
                contact_info: profile.contact_info
            })
        });

        const result = await res.json();

        if (!res.ok) {
            setError(result.error || 'Failed to save profile');
            setSaving(false);
            return;
        }

        setProfile(result);
        refreshProfileStatus();
        setSaving(false);
    }

    async function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const formData = new FormData();
        formData.append('avatar', file);

        const res = await fetch('http://127.0.0.1:4000/api/profiles/me/avatar', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const updated = await res.json();
        setProfile(updated);
        setUploading(false);
    }

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h1>My profile</h1>

            {profile.profile_picture_url && (
                <img
                    src={`${profile.profile_picture_url}?t=${Date.now()}`}
                    alt="Profile"
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                />
            )}

            <div>
                <label>Profile picture</label>
                <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
                {uploading && <p>Uploading...</p>}
            </div>

            <form onSubmit={handleSave}>
                <div>
                    <label>Name</label>
                    <input value={profile.name || ''} onChange={(e) => handleChange('name', e.target.value)} required />
                </div>
                <div>
                    <label>Year</label>
                    <input value={profile.year || ''} onChange={(e) => handleChange('year', e.target.value)} required />
                </div>
                <div>
                    <label>Major</label>
                    <input value={profile.major || ''} onChange={(e) => handleChange('major', e.target.value)} required />
                </div>
                <div>
                    <label>Bio</label>
                    <textarea value={profile.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} />
                </div>
                <div>
                    <label>GitHub URL</label>
                    <input value={profile.github_url || ''} onChange={(e) => handleChange('github_url', e.target.value)} />
                </div>
                <div>
                    <label>Portfolio URL</label>
                    <input value={profile.portfolio_url || ''} onChange={(e) => handleChange('portfolio_url', e.target.value)} />
                </div>
                <div>
                    <label>LinkedIn URL</label>
                    <input value={profile.linkedin_url || ''} onChange={(e) => handleChange('linkedin_url', e.target.value)} />
                </div>
                <div>
                    <label>Contact info</label>
                    <input value={profile.contact_info || ''} onChange={(e) => handleChange('contact_info', e.target.value)} />
                </div>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            </form>

            <h2>Projects I own</h2>
            {ownedProjects.length === 0 && <p>You haven't posted any projects yet.</p>}
            {ownedProjects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card">
                        <strong>{project.title}</strong> — {project.status}
                    </div>
                </Link>
            ))}

            <h2>Projects I'm part of</h2>
            {memberProjects.length === 0 && <p>You're not a member of any projects yet.</p>}
            {memberProjects.map((project) => (
                <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card">
                        <strong>{project.title}</strong> — {project.member_role || 'Member'}
                    </div>
                </Link>
            ))}
        </div>
    );
}