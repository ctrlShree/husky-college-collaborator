import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { API_URL } from '../lib/apiUrl';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myRequest, setMyRequest] = useState(undefined);
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [removingImageUrl, setRemovingImageUrl] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const userId = sessionData.session?.user?.id;

      const projectRes = await fetch(`${API_URL}/api/projects/${id}`);

      if (!projectRes.ok) {
        if (!ignore) {
          setError('Project not found');
          setLoading(false);
        }
        return;
      }

      const projectData = await projectRes.json();

      let myRequestData = null;
      if (token) {
        const myRequestRes = await fetch(`${API_URL}/api/projects/${id}/requests/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (myRequestRes.ok) {
          myRequestData = await myRequestRes.json();
        }
      }

      if (!ignore) {
        setProject(projectData);
        setCurrentUserId(userId);
        setMyRequest(myRequestData);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [id]);

  async function handleRequestSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setRequestError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(`${API_URL}/api/projects/${id}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        requested_role: selectedRole || null
      })
    });

    const result = await res.json();

    if (!res.ok) {
      setRequestError(result.error || 'Failed to submit request');
      setSubmitting(false);
      return;
    }

    setMyRequest(result);
    setSubmitting(false);
  }

  function startEditing() {
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      affiliation: project.affiliation || 'independent',
      status: project.status || 'recruiting',
      meeting_mode: project.meeting_mode || 'in_person',
      location: project.location || '',
      tech_stack: (project.tech_stack || []).join(', '),
      roles_needed: (project.roles_needed || []).join(', '),
      github_url: project.github_url || ''
    });
    setEditError(null);
    setNewImages([]);
    setIsEditing(true);
  }

  function handleEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSavingEdit(true);
    setEditError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const techStackArray = editForm.tech_stack
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const rolesNeededArray = editForm.roles_needed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const res = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        affiliation: editForm.affiliation,
        status: editForm.status,
        meeting_mode: editForm.meeting_mode,
        location: editForm.location,
        tech_stack: techStackArray,
        roles_needed: rolesNeededArray,
        github_url: editForm.github_url
      })
    });

    const result = await res.json();

    if (!res.ok) {
      setEditError(result.error || 'Failed to save changes');
      setSavingEdit(false);
      return;
    }

    setProject(result);
    setSavingEdit(false);
    setIsEditing(false);
  }

  async function handleAddImages() {
    if (newImages.length === 0) {
      return;
    }

    setUploadingImages(true);
    setEditError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const formData = new FormData();
    for (const file of newImages) {
      formData.append('images', file);
    }

    const res = await fetch(`${API_URL}/api/projects/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      setEditError(result.error || 'Failed to upload images');
      setUploadingImages(false);
      return;
    }

    setProject(result);
    setNewImages([]);
    setUploadingImages(false);
  }

  async function handleRemoveImage(imageUrl) {
    setRemovingImageUrl(imageUrl);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(`${API_URL}/api/projects/${id}/images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ imageUrl })
    });

    const result = await res.json();

    if (!res.ok) {
      setEditError(result.error || 'Failed to remove image');
      setRemovingImageUrl(null);
      return;
    }

    setProject(result);
    setRemovingImageUrl(null);
  }

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this project? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch(`${API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const result = await res.json();
      alert(result.error || 'Failed to delete project');
      setDeleting(false);
      return;
    }

    navigate('/browse');
  }

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  const isOwner = currentUserId === project.owner_id;

  if (isEditing) {
    return (
      <div>
        <h1>Edit project</h1>
        <form onSubmit={handleEditSubmit}>
          <div>
            <label>Title</label>
            <input value={editForm.title} onChange={(e) => handleEditChange('title', e.target.value)} required />
          </div>
          <div>
            <label>Description</label>
            <textarea value={editForm.description} onChange={(e) => handleEditChange('description', e.target.value)} />
          </div>
          <div>
            <label>Affiliation</label>
            <select value={editForm.affiliation} onChange={(e) => handleEditChange('affiliation', e.target.value)}>
              <option value="independent">Independent</option>
              <option value="university">University</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={editForm.status} onChange={(e) => handleEditChange('status', e.target.value)}>
              <option value="recruiting">Recruiting</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label>Meeting mode</label>
            <select value={editForm.meeting_mode} onChange={(e) => handleEditChange('meeting_mode', e.target.value)}>
              <option value="in_person">In person</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label>Location</label>
            <input value={editForm.location} onChange={(e) => handleEditChange('location', e.target.value)} />
          </div>
          <div>
            <label>Tech stack (comma separated)</label>
            <input value={editForm.tech_stack} onChange={(e) => handleEditChange('tech_stack', e.target.value)} />
          </div>
          <div>
            <label>Roles needed (comma separated)</label>
            <input value={editForm.roles_needed} onChange={(e) => handleEditChange('roles_needed', e.target.value)} />
          </div>
          <div>
            <label>GitHub URL</label>
            <input value={editForm.github_url} onChange={(e) => handleEditChange('github_url', e.target.value)} />
          </div>
          {editError && <p style={{ color: 'red' }}>{editError}</p>}
          <button type="submit" disabled={savingEdit}>
            {savingEdit ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ background: 'transparent', color: 'var(--black)', textDecoration: 'underline' }}
          >
            Cancel
          </button>
        </form>

        <h2>Images</h2>
        {project.images && project.images.length > 0 && (
          <div>
            {project.images.map((url) => (
              <div key={url} style={{ display: 'inline-block', marginRight: '0.5rem', marginBottom: '0.5rem' }}>
                <img src={url} alt="" style={{ maxWidth: '150px', display: 'block' }} />
                <button onClick={() => handleRemoveImage(url)} disabled={removingImageUrl === url}>
                  {removingImageUrl === url ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label>Add images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewImages(Array.from(e.target.files))}
          />
          <button onClick={handleAddImages} disabled={uploadingImages || newImages.length === 0}>
            {uploadingImages ? 'Uploading...' : 'Upload selected images'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <p>{project.affiliation} · {project.status} · {project.meeting_mode}</p>
      {project.location && <p>Location: {project.location}</p>}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <p>Tech stack: {project.tech_stack.join(', ')}</p>
      )}
      {project.roles_needed && project.roles_needed.length > 0 && (
        <p>Roles needed: {project.roles_needed.join(', ')}</p>
      )}
      {project.github_url && (
        <p>
          <a href={project.github_url} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </p>
      )}
      {project.images && project.images.length > 0 && (
        <div>
          {project.images.map((url) => (
            <img key={url} src={url} alt="" style={{ maxWidth: '200px', marginRight: '0.5rem' }} />
          ))}
        </div>
      )}
      <p>
        <Link to={`/profile/${project.owner_id}`}>View project owner's profile</Link>
      </p>

      {isOwner && (
        <div>
          <button onClick={startEditing}>Edit project</button>
          <button onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete project'}
          </button>
        </div>
      )}

      {!isOwner && myRequest === null && (
        <form onSubmit={handleRequestSubmit}>
          <h2>Request to join</h2>
          {project.roles_needed && project.roles_needed.length > 0 && (
            <div>
              <label>Role (optional)</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="">No specific role</option>
                {project.roles_needed.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label>Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {requestError && <p style={{ color: 'red' }}>{requestError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Request to join'}
          </button>
        </form>
      )}

      {!isOwner && myRequest && (
        <p>
          Your request status: <strong>{myRequest.status}</strong>
        </p>
      )}
    </div>
  );
}