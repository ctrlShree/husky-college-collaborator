import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { API_URL } from '../lib/apiUrl';

export default function MyRequests() {
  const [projects, setProjects] = useState([]);
  const [requestsByProject, setRequestsByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const projectsRes = await fetch(`${API_URL}/api/projects/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const myProjects = await projectsRes.json();

        const requestResults = await Promise.all(
          myProjects.map((project) =>
            fetch(`${API_URL}/api/projects/${project.id}/requests`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then((res) => res.json())
          )
        );

        const requestsMap = {};
        myProjects.forEach((project, i) => {
          requestsMap[project.id] = requestResults[i];
        });

        if (!ignore) {
          setProjects(myProjects);
          setRequestsByProject(requestsMap);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleUpdateStatus(projectId, requestId, status) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(
      `${API_URL}/api/projects/${projectId}/requests/${requestId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      }
    );

    const updated = await res.json();

    setRequestsByProject((prev) => ({
      ...prev,
      [projectId]: prev[projectId].map((r) => (r.id === updated.id ? updated : r))
    }));
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Requests for my projects</h1>
      {projects.map((project) => (
        <div key={project.id} style={{ marginBottom: '2rem' }}>
          <h2>{project.title}</h2>
          {(requestsByProject[project.id] || []).length === 0 && <p>No requests yet.</p>}
          {(requestsByProject[project.id] || []).map((request) => (
            <div key={request.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem' }}>
              <p>{request.message}</p>
              <p>Status: {request.status}</p>
              {request.status === 'pending' && (
                <>
                  <button onClick={() => handleUpdateStatus(project.id, request.id, 'accepted')}>
                    Accept
                  </button>
                  <button onClick={() => handleUpdateStatus(project.id, request.id, 'declined')}>
                    Decline
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}