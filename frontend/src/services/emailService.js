import { api } from './api.js';

export const emailService = {
  async scheduleEmail({ recipient, subject, body, scheduledAt }) {
    const res = await api.post('/emails/schedule', {
      recipient,
      subject,
      body,
      scheduledAt,
    });
    return res.data;
  },

  async getEmails({ status, page = 1, limit = 10, search = '' } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const res = await api.get(`/emails?${params.toString()}`);
    return res.data;
  },

  async getEmailById(id) {
    const res = await api.get(`/emails/${id}`);
    return res.data;
  },

  async cancelEmail(id) {
    const res = await api.delete(`/emails/${id}/cancel`);
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/emails/stats');
    return res.data;
  },
};
