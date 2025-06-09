import { Router } from 'express';
import { ProposalController } from '../controllers/proposals/proposal.controller';
import { authenticate } from '../middleware/auth';
import { hasRole } from '../middleware/auth';

const router = Router();
const proposalController = new ProposalController();

// All proposal routes require authentication
router.use(authenticate);

// Proposal CRUD routes
router.get('/', hasRole(['admin', 'designer']), proposalController.getProposals.bind(proposalController));
router.post('/', hasRole(['admin', 'designer']), proposalController.createProposal.bind(proposalController));
router.get('/:id', proposalController.getProposal.bind(proposalController));
router.put('/:id', hasRole(['admin', 'designer']), proposalController.updateProposal.bind(proposalController));
router.delete('/:id', hasRole(['admin', 'designer']), proposalController.deleteProposal.bind(proposalController));

// Project proposal routes
router.get('/project/:projectId', proposalController.getProjectProposals.bind(proposalController));

// Client portal proposal routes
router.post('/:id/approve', proposalController.approveProposal.bind(proposalController));
router.post('/:id/comments', proposalController.addComment.bind(proposalController));

export default router; 