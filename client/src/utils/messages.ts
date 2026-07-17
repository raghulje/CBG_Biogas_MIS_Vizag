// Centralized user-facing message strings for snackbars and alerts
const MESSAGES = {
  // MIS entries
  ENTRY_CREATED: 'Entry created successfully',
  ENTRY_UPDATED: 'Entry updated successfully',
  ENTRY_DELETED: 'Entry deleted successfully',
  ENTRY_DELETE_FAILED: 'Failed to delete entry',

  // Import / Export
  IMPORT_SUCCESS: 'Import completed successfully',
  IMPORT_FAILED: 'Failed to import file',
  EXPORT_FAILED: 'Export failed',
  FINAL_MIS_REPORT_DOWNLOAD_FAILED: 'Failed to download Final MIS report',
  IMPORT_DATA_SUCCESS: 'Data imported successfully',
  IMPORT_DATA_FAILED_PREFIX: 'Import failed: ',

  // Admin notifications/schedulers
  SCHEDULE_UPDATED: 'Schedule updated successfully',
  SCHEDULE_UPDATE_FAILED: 'Failed to save schedule',
  RECIPIENTS_UPDATED: 'Recipients updated successfully',
  RECIPIENTS_UPDATE_FAILED: 'Failed to save recipients',
  TEMPLATE_SAVED: (name: string) => `Template '${name}' saved`,
  TEMPLATE_SAVE_FAILED: 'Failed to save template',

  // Entry workflow
  ENTRY_SUBMITTED: 'Entry submitted successfully',
  ENTRY_CREATED_SUBMITTED: 'Entry created and submitted successfully',
  ENTRY_UPDATED_SUBMITTED: 'Entry updated and submitted successfully',
  DRAFT_SAVED: 'Draft saved successfully',
  DRAFT_UPDATED: 'Draft updated successfully',
  ENTRY_APPROVED: 'Entry approved!',
  ENTRY_REJECTED: 'Entry rejected!',
  FAILED_LOAD_ENTRY_DETAILS: 'Failed to load entry details',
  FAILED_DELETE_ENTRY: 'Failed to delete entry',

  // Bulk actions
  DELETED_N_ENTRIES: (n: number) => `${n} entries deleted`,

  // Users & permissions
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DEACTIVATED: 'User deactivated',
  USER_DEACTIVATE_FAILED: 'Failed to deactivate user',
  PERMISSIONS_SAVED: 'Permissions saved successfully',

  // Login / auth
  RESET_LINK_SENT: 'If the email exists, a reset link has been sent.',
  RESET_LINK_FAILED: 'Failed to send reset email. Please try again later.',

  // Dashboard
  FAILED_LOAD_BREAKDOWN: 'Failed to load breakdown',

  // Access controls
  NO_ACCESS_TO_DRAFTS: 'You do not have access to draft entries.',

  // Customer
  CUSTOMER_CREATED: 'Customer created successfully',
  CUSTOMER_UPDATED: 'Customer updated successfully',
  CUSTOMER_DELETED: 'Customer deleted',
  CUSTOMER_SAVE_FAILED: 'Failed to save customer',

  // Generic
  ACTION_FAILED: 'Action failed. Please try again.',
};

export default MESSAGES;

