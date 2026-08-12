import { ApiResponse } from '../../utils/http/ApiResponse.js';
import * as ticketService from './ticket.service.js';

export const httpCreateTicket = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { subject, category, priority, description, contactPhone, contactEmail } = req.body;

    const result = await ticketService.createTicket({
      tenantId,
      userId,
      subject,
      category,
      priority,
      description,
      contactPhone,
      contactEmail,
    });

    return ApiResponse.created(res, result, 'Support ticket submitted successfully');
  } catch (error) {
    next(error);
  }
};

export const httpGetShopTickets = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const { page = 1, limit = 20, status, search } = req.query;

    const result = await ticketService.getShopTickets(
      tenantId,
      Number(page),
      Number(limit),
      status,
      search
    );

    return ApiResponse.paginated(
      res,
      result.tickets,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'Shop support tickets retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const httpGetAllTicketsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tenantId, status, priority, search } = req.query;

    const result = await ticketService.getAllTicketsAdmin(
      Number(page),
      Number(limit),
      { tenantId, status, priority, search }
    );

    return ApiResponse.paginated(
      res,
      result.tickets,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit,
      'All support tickets retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const httpGetTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || null;

    const ticket = await ticketService.getTicketById(id, tenantId);

    return ApiResponse.success(res, ticket, 'Ticket details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const httpUpdateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const adminUserId = req.user?.id;

    const updated = await ticketService.updateTicketStatus(id, { status, resolutionNotes }, adminUserId);

    return ApiResponse.success(res, updated, `Ticket status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const httpDeleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || null;
    await ticketService.deleteTicket(id, tenantId);
    return ApiResponse.success(res, null, 'Ticket deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const httpBulkDeleteTickets = async (req, res, next) => {
  try {
    const { ticketIds } = req.body;
    const tenantId = req.user?.tenantId || null;
    const result = await ticketService.bulkDeleteTickets(ticketIds, tenantId);
    return ApiResponse.success(res, result, `${result.deletedCount} tickets deleted successfully`);
  } catch (error) {
    next(error);
  }
};
