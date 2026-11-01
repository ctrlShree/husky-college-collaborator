import { supabase } from '../lib/supabaseClient.js';

export async function getMyProfile(req, res) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function updateMyProfile(req, res) {
  const { name, year, major, bio, github_url, portfolio_url, linkedin_url, contact_info } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .update({ name, year, major, bio, github_url, portfolio_url, linkedin_url, contact_info })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}


export async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = `${req.user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true
    });

  if (uploadError) {
    return res.status(500).json({ error: uploadError.message });
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('profiles')
    .update({ profile_picture_url: urlData.publicUrl })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function uploadProjectImages(req, res) {
  const { projectId } = req.params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('owner_id, images')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can upload images' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedUrls = [];

  for (const file of req.files) {
    const filePath = `${projectId}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    uploadedUrls.push(urlData.publicUrl);
  }

  const existingImages = project.images || [];
  const newImages = [...existingImages, ...uploadedUrls];

  const { data, error } = await supabase
    .from('projects')
    .update({ images: newImages })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function getPublicProfile(req, res) {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  res.json(data);
}