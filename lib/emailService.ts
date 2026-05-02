export const emailService = {
  async sendShiftAssigned(options: { to: string; shiftTitle: string; volunteerName: string }) {
    console.log(`[Email] Shift assigned: ${options.shiftTitle} to ${options.volunteerName} at ${options.to}`);
    return { success: true };
  },

  async sendShiftChanged(options: { to: string; shiftTitle: string; changes: string }) {
    console.log(`[Email] Shift changed: ${options.shiftTitle} - ${options.changes} to ${options.to}`);
    return { success: true };
  },

  async sendApplicationApproved(options: { to: string; eventName: string; volunteerName: string }) {
    console.log(`[Email] Application approved: ${options.eventName} for ${options.volunteerName} at ${options.to}`);
    return { success: true };
  },

  async sendReminder(options: { to: string; shiftTitle: string; when: '24h' | '2h' }) {
    console.log(`[Email] Reminder (${options.when}): ${options.shiftTitle} to ${options.to}`);
    return { success: true };
  },
};