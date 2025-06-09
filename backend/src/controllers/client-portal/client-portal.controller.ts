import { Request, Response } from 'express';
import { supabase } from '../../utils/supabaseClient';

export class ClientPortalController {
  // Project methods (refactored to use Supabase)
  async getProjects(req: Request, res: Response) {
    try {
      const clientId = req.user.clientId;
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*, proposals:proposal_id(*), estimates:estimate_id(*), moodboards:moodboard_id(*)')
        .eq('client_id', clientId);
      if (error) throw error;
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching projects', error });
    }
  }

  async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = req.user.clientId;
      const { data: project, error } = await supabase
        .from('projects')
        .select('*, proposals:proposal_id(*), estimates:estimate_id(*), moodboards:moodboard_id(*)')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();
      if (error) throw error;
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching project', error });
    }
  }

  // Proposal methods (refactored to use Supabase)
  async getProposals(req: Request, res: Response) {
    try {
      const clientId = req.user.clientId;
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('*, project:project_id(*)')
        .eq('client_id', clientId);
      if (error) throw error;
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching proposals', error });
    }
  }

  async getProposal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = req.user.clientId;
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*, project:project_id(*)')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();
      if (error) throw error;
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      res.json(proposal);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching proposal', error });
    }
  }

  async approveProposal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = req.user.clientId;
      // Fetch proposal
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();
      if (error) throw error;
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      // Update status
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ status: 'approved' })
        .eq('id', id);
      if (updateError) throw updateError;
      res.json({ ...proposal, status: 'approved' });
    } catch (error) {
      res.status(500).json({ message: 'Error approving proposal', error });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const clientId = req.user.clientId;
      // Fetch proposal
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();
      if (error) throw error;
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      // Add comment (assuming comments is a JSONB array column)
      const newComment = {
        text: comment,
        author: clientId,
        createdAt: new Date().toISOString()
      };
      const updatedComments = [...(proposal.comments || []), newComment];
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ comments: updatedComments })
        .eq('id', id);
      if (updateError) throw updateError;
      res.json({ ...proposal, comments: updatedComments });
    } catch (error) {
      res.status(500).json({ message: 'Error adding comment', error });
    }
  }

  // Estimate methods (refactored to use Supabase)
  async getEstimates(req: Request, res: Response) {
    try {
      const clientId = req.user.clientId;
      const { data: estimates, error } = await supabase
        .from('estimates')
        .select('*, project:project_id(*)')
        .eq('client_id', clientId);
      if (error) throw error;
      res.json(estimates);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching estimates', error });
    }
  }

  async getEstimate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = req.user.clientId;
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select('*, project:project_id(*)')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();
      if (error) throw error;
      if (!estimate) {
        return res.status(404).json({ message: 'Estimate not found' });
      }
      res.json(estimate);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching estimate', error });
    }
  }

  // Moodboard methods
  async getMoodboards(req: Request, res: Response) {
    try {
      const clientId = req.user.clientId;
      const moodboards = await Moodboard.find({ client: clientId })
        .populate('project');
      
      res.json(moodboards);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching moodboards', error });
    }
  }

  async getMoodboard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = req.user.clientId;
      
      const moodboard = await Moodboard.findOne({ _id: id, client: clientId })
        .populate('project');
      
      if (!moodboard) {
        return res.status(404).json({ message: 'Moodboard not found' });
      }
      
      res.json(moodboard);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching moodboard', error });
    }
  }
} 