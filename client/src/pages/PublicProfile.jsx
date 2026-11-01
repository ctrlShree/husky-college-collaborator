import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [memberProjects, setMemberProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const [profileRes, ownedRes, memberRes] = await Promise.all([
        fetch(`http://127.0.0.1:4000/api/profiles/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://127.0.0.1:4000/api/projects?owner=${userId}`),
        fetch(`http://127.0.0.1:4000/api/projects/member/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!profileRes.ok) {
        if (!ignore) {
          setError('Profile not found');
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
  }, [userId]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      {profile.profile_picture_url && (
        <img
          src={profile.profile_picture_url}
          alt="Profile"
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
        />
      )}
      <h1>{profile.name || 'Unnamed user'}</h1>
      <p>{profile.year} {profile.major && `· ${profile.major}`}</p>
      {profile.bio && <p>{profile.bio}</p>}

      <ul>
        {profile.github_url && <li><a href={profile.github_url} target="_blank" rel="noreferrer">GitHub</a></li>}
        {profile.portfolio_url && <li><a href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a></li>}
        {profile.linkedin_url && <li><a href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a></li>}
        {profile.contact_info && <li>Contact: {profile.contact_info}</li>}
      </ul>

      <h2>Projects owned</h2>
      {ownedProjects.length === 0 && <p>No projects posted yet.</p>}
      {ownedProjects.map((project) => (
        <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <strong>{project.title}</strong> — {project.status}
          </div>
        </Link>
      ))}

      <h2>Projects part of</h2>
      {memberProjects.length === 0 && <p>Not a member of any projects yet.</p>}
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