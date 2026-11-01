import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Laptop, Users } from 'lucide-react';

function getMeetingModeIcon(mode) {
  if (mode === 'remote') return <Laptop size={13} />;
  if (mode === 'hybrid') return <Users size={13} />;
  return <MapPin size={13} />;
}

export default function Browse() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function fetchProjects() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);

        const response = await fetch(`http://127.0.0.1:4000/api/projects?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        if (!ignore) {
          setProjects(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    const debounceTimer = setTimeout(fetchProjects, 400);

    return () => {
      ignore = true;
      clearTimeout(debounceTimer);
    };
  }, [searchTerm]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Browse projects</h1>
      <input
        type="text"
        placeholder="Search by keyword or tech..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%' }}
      />
      {loading && <p>Loading...</p>}
      {!loading && projects.length === 0 && <p>No projects found.</p>}
      {projects.map((project) => (
        <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {project.images && project.images.length > 0 && (
              <img
                src={project.images[0]}
                alt=""
                style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
              />
            )}
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem' }}>
                <h3 style={{ margin: 0 }}>{project.title}</h3>
                <span className={`tag tag-${project.status}`}>{project.status.replace('_', ' ')}</span>
              </div>
              <p className="meta">{project.description}</p>
              <div>
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={13} /> {project.affiliation}
                </span>
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {getMeetingModeIcon(project.meeting_mode)} {project.meeting_mode.replace('_', ' ')}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--gray-border)', marginTop: '0.75rem', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {project.owner?.profile_picture_url ? (
                  <img src={project.owner.profile_picture_url} alt="" className="avatar avatar-sm" />
                ) : (
                  <div className="avatar avatar-sm" style={{ background: 'var(--black)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                    {project.owner?.name ? project.owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?'}
                  </div>
                )}
                <span className="meta">Posted by {project.owner?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}