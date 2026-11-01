import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AGENT_URL } from '../lib/agentUrl';

export default function AskAI() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setProjects([]);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch(`${AGENT_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.detail || 'Something went wrong');
        setLoading(false);
        return;
      }

      setAnswer(result.answer);
      setProjects(result.projects);
      setLoading(false);
    } catch (err) {
      setError('Could not reach the AI service. It may be waking up — try again in a moment.');
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Ask AI</h1>
      <p className="meta">Describe what you're looking for in plain language, like "a React project that needs a designer."</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Your question</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find me a project that needs a backend developer"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {answer && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0 }}>{answer}</p>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <h3 style={{ margin: 0 }}>{project.title}</h3>
                <p className="meta">{project.description}</p>
                <div>
                  <span className="tag">{project.status}</span>
                  {project.meeting_mode && <span className="tag">{project.meeting_mode}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}