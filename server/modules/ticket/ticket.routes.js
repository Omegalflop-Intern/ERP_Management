import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requireSuperAdmin } from '../../middleware/tenant.middleware.js';
import * as ticketController from './ticket.controller.js';
import { createTicketSchema, updateTicketStatusSchema } from './ticket.validator.js';

const router = Router();

router.use(authenticate);

// Shop routes (for tenant staff/owner)
router.post('/', validate(createTicketSchema), ticketController.httpCreateTicket);
router.get('/', ticketController.httpGetShopTickets);
router.delete('/:id', ticketController.httpDeleteTicket);

// Super Admin route to view all tickets across shops
router.get('/admin/all', requireSuperAdmin, ticketController.httpGetAllTicketsAdmin);

// Single ticket detail route
router.get('/:id', ticketController.httpGetTicketById);

// Super Admin route to update status / resolve ticket
router.patch('/:id/status', requireSuperAdmin, validate(updateTicketStatusSchema), ticketController.httpUpdateTicketStatus);

// Delete ticket (super admin can delete any; shop users can delete their own)
router.post('/bulk-delete', ticketController.httpBulkDeleteTickets);
router.delete('/:id', ticketController.httpDeleteTicket);

export default router;
