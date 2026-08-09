import * as contactService from './contact.service.js';
import { ApiResponse } from '../../utils/http/ApiResponse.js';

export const submitContact = async (req, res, next) => {
  try {
    const result = await contactService.submitContactForm(req.body);
    return ApiResponse.created(res, result, 'Your message has been sent successfully.');
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req, res, next) => {
  try {
    const messages = await contactService.getContactMessages();
    return ApiResponse.success(res, messages, 'Contact messages retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await contactService.updateContactStatus(req.params.id, status);
    return ApiResponse.success(res, result, `Status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
