import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { API_URL } from '../lib/apiUrl';


export default function PostProject() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [affiliation, setAffiliation] = useState('independent');
  const [status, setStatus] = useState('recruiting');
  const [meetingMode, setMeetingMode] = useState('in_person');
  const [location, setLocation] = useState('');
  const [techStack, setTechStack] = useState('');
  const [rolesNeeded, setRolesNeeded] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setError('You must be logged in to post a project.');
      setSubmitting(false);
      return;
    }

    const techStackArray = techStack
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const rolesNeededArray = rolesNeeded
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const createRes = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        affiliation,
        status,
        meeting_mode: meetingMode,
        location,
        tech_stack: techStackArray,
        roles_needed: rolesNeededArray,
        github_url: githubUrl
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      setError(errData.error || 'Failed to create project');
      setSubmitting(false);
      return;
    }

    const newProject = await createRes.json();

    if (images.length > 0) {
      const formData = new FormData();
      for (const file of images) {
        formData.append('images', file);
      }

      const imageRes = await fetch(`${API_URL}/api/projects/${newProject.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!imageRes.ok) {
        setError('Project created, but image upload failed.');
        setSubmitting(false);
        navigate(`/projects/${newProject.id}`);
        return;
      }
    }

    setSubmitting(false);
    navigate(`/projects/${newProject.id}`);
  }

  return (
    <div>
      <h1>Post a project</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Affiliation</label>
          <select value={affiliation} onChange={(e) => setAffiliation(e.target.value)}>
            <option value="independent">Independent</option>
            <option value="university">University</option>
          </select>
        </div>
        <div>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="recruiting">Recruiting</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label>Meeting mode</label>
          <select value={meetingMode} onChange={(e) => setMeetingMode(e.target.value)}>
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label>Location (optional)</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label>Tech stack (comma separated)</label>
          <input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="React, Node.js, PostgreSQL"
          />
        </div>
        <div>
          <label>Roles needed (comma separated)</label>
          <input
            value={rolesNeeded}
            onChange={(e) => setRolesNeeded(e.target.value)}
            placeholder="Frontend, Backend, Designer"
          />
        </div>
        <div>
          <label>GitHub URL (optional)</label>
          <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
        </div>
        <div>
          <label>Images (optional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files))}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post project'}
        </button>
      </form>
    </div>
  );
}