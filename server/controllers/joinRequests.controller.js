import { supabase } from '../lib/supabaseClient.js';

export async function createJoinRequest(req, res) {
  const { projectId } = req.params;
  const { message, requested_role } = req.body;

  const { data: existing } = await supabase
    .from('join_requests')
    .select('id')
    .eq('project_id', projectId)
    .eq('requester_id', req.user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'You already have a pending request for this project' });
  }

  const { data, error } = await supabase
    .from('join_requests')
    .insert({
      project_id: projectId,
      requester_id: req.user.id,
      message,
      requested_role
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
}

export async function getJoinRequestsForProject(req, res) {
    const { projectId } = req.params;

    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

    if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the project owner can view join requests' });
    }

    const { data, error } = await supabase
        .from('join_requests')
        .select('*')
        .eq('project_id', projectId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
}

export async function updateJoinRequestStatus(req, res) {
  const { projectId, requestId } = req.params;
  const { status } = req.body;

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "accepted" or "declined"' });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can update join requests' });
  }

  const { data: updatedRequest, error } = await supabase
    .from('join_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  let memberNote = null;

  if (status === 'accepted') {
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', updatedRequest.requester_id)
      .maybeSingle();

    if (!existingMember) {
      const { error: insertError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: updatedRequest.requester_id,
          role: updatedRequest.requested_role
        });

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
    } else if (existingMember.role !== updatedRequest.requested_role) {
      const { error: updateError } = await supabase
        .from('project_members')
        .update({ role: updatedRequest.requested_role })
        .eq('project_id', projectId)
        .eq('user_id', updatedRequest.requester_id);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    } else {
      memberNote = 'Already a member with this role';
    }
  }

  res.json({ ...updatedRequest, member_note: memberNote });
}

export async function getMyRequestForProject(req, res) {
  const { projectId } = req.params;

  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .eq('project_id', projectId)
    .eq('requester_id', req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}