import { supabase } from '../lib/supabaseClient.js';

export async function getProjects(req, res) {
    const { affiliation, status, meeting_mode, tech, owner, search } = req.query;

    let query = supabase.from('projects').select('*, owner:profiles(name, profile_picture_url)');

    if (affiliation) query = query.eq('affiliation', affiliation);
    if (status) query = query.eq('status', status);
    if (meeting_mode) query = query.eq('meeting_mode', meeting_mode);
    if (tech) query = query.contains('tech_stack', [tech]);
    if (owner) query = query.eq('owner_id', owner);
    if (search) {
        query = query.textSearch('search_vector', search, { type: 'websearch', config: 'english' });
    }

    const { data, error } = await query;

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
}

export async function createProject(req, res) {
    const { title, description, affiliation, status, meeting_mode, location, tech_stack, images, github_url, roles_needed } = req.body;

    if (!title || !affiliation) {
        return res.status(400).json({ error: 'Title and affiliation are required' });
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            title,
            description,
            affiliation,
            status,
            meeting_mode,
            location,
            tech_stack,
            images,
            github_url,
            roles_needed,
            owner_id: req.user.id
        })
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
}

export async function getMyProjects(req, res) {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', req.user.id);

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

export async function getProjectsForUser(req, res) {
    const { userId } = req.params;

    const { data, error } = await supabase
        .from('project_members')
        .select('role, projects(*)')
        .eq('user_id', userId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const result = data.map((row) => ({
        ...row.projects,
        member_role: row.role
    }));

    res.json(result);
}

export async function getProjectById(req, res) {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'Project not found' });
    }

    res.json(data);
}

export async function updateProject(req, res) {
    const { id } = req.params;
    const { title, description, affiliation, status, meeting_mode, location, tech_stack, roles_needed, github_url } = req.body;

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the project owner can edit this project' });
    }

    const { data, error } = await supabase
        .from('projects')
        .update({ title, description, affiliation, status, meeting_mode, location, tech_stack, roles_needed, github_url })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
}

export async function deleteProject(req, res) {
    const { id } = req.params;

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the project owner can delete this project' });
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(204).send();
}

export async function removeProjectImage(req, res) {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl is required' });
    }

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, images')
        .eq('id', id)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the project owner can remove images' });
    }

    const updatedImages = (project.images || []).filter((url) => url !== imageUrl);

    const { data, error } = await supabase
        .from('projects')
        .update({ images: updatedImages })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const storagePath = imageUrl.split('/project-images/')[1];
    if (storagePath) {
        await supabase.storage.from('project-images').remove([storagePath]);
    }

    res.json(data);
}