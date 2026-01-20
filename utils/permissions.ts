import { UserRole, User } from '../types';

// Permission levels mapped to user roles
export type PermissionLevel = 'owner' | 'admin' | 'operator';

// Map roles to permission levels
export const getRolePermissionLevel = (role: UserRole): PermissionLevel => {
  switch (role) {
    case 'Admin':
      return 'owner';
    case 'Manager':
      return 'admin';
    case 'Sales':
    case 'Production':
    case 'Fulfillment':
    case 'ReadOnly':
    default:
      return 'operator';
  }
};

// Permission definitions
export interface Permissions {
  // User management
  canManageUsers: boolean;
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canImportUsers: boolean;

  // Settings
  canAccessSettings: boolean;
  canModifySettings: boolean;

  // Orders
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;
  canAdvanceStage: boolean;
  canArchiveOrders: boolean;

  // Specific stage access
  canAccessSalesStages: boolean;
  canAccessProductionStages: boolean;
  canAccessFulfillmentStages: boolean;

  // Reports
  canViewReports: boolean;
  canExportReports: boolean;

  // Views
  canAccessProductionFloor: boolean;
  canAccessFulfillmentTracking: boolean;

  // Art/Files
  canUploadArt: boolean;
  canApproveArt: boolean;
}

// Get permissions for a user
export const getPermissions = (user: User | null): Permissions => {
  if (!user) {
    return getDefaultPermissions();
  }

  const level = getRolePermissionLevel(user.role);

  switch (level) {
    case 'owner':
      return getOwnerPermissions();
    case 'admin':
      return getAdminPermissions();
    case 'operator':
      return getOperatorPermissions(user.role);
    default:
      return getDefaultPermissions();
  }
};

// Owner permissions (Admin role) - full access
const getOwnerPermissions = (): Permissions => ({
  canManageUsers: true,
  canCreateUsers: true,
  canDeleteUsers: true,
  canImportUsers: true,
  canAccessSettings: true,
  canModifySettings: true,
  canCreateOrders: true,
  canEditOrders: true,
  canDeleteOrders: true,
  canAdvanceStage: true,
  canArchiveOrders: true,
  canAccessSalesStages: true,
  canAccessProductionStages: true,
  canAccessFulfillmentStages: true,
  canViewReports: true,
  canExportReports: true,
  canAccessProductionFloor: true,
  canAccessFulfillmentTracking: true,
  canUploadArt: true,
  canApproveArt: true,
});

// Admin permissions (Manager role) - can manage users and settings, view all
const getAdminPermissions = (): Permissions => ({
  canManageUsers: true,
  canCreateUsers: true,
  canDeleteUsers: false, // Cannot delete users
  canImportUsers: true,
  canAccessSettings: true,
  canModifySettings: true,
  canCreateOrders: true,
  canEditOrders: true,
  canDeleteOrders: false,
  canAdvanceStage: true,
  canArchiveOrders: true,
  canAccessSalesStages: true,
  canAccessProductionStages: true,
  canAccessFulfillmentStages: true,
  canViewReports: true,
  canExportReports: true,
  canAccessProductionFloor: true,
  canAccessFulfillmentTracking: true,
  canUploadArt: true,
  canApproveArt: true,
});

// Operator permissions - department-specific access
const getOperatorPermissions = (role: UserRole): Permissions => {
  const basePermissions: Permissions = {
    canManageUsers: false,
    canCreateUsers: false,
    canDeleteUsers: false,
    canImportUsers: false,
    canAccessSettings: false,
    canModifySettings: false,
    canCreateOrders: false,
    canEditOrders: false,
    canDeleteOrders: false,
    canAdvanceStage: false,
    canArchiveOrders: false,
    canAccessSalesStages: false,
    canAccessProductionStages: false,
    canAccessFulfillmentStages: false,
    canViewReports: false,
    canExportReports: false,
    canAccessProductionFloor: false,
    canAccessFulfillmentTracking: false,
    canUploadArt: false,
    canApproveArt: false,
  };

  switch (role) {
    case 'Sales':
      return {
        ...basePermissions,
        canCreateOrders: true,
        canEditOrders: true,
        canAdvanceStage: true,
        canAccessSalesStages: true,
        canUploadArt: true,
        canViewReports: true,
      };
    case 'Production':
      return {
        ...basePermissions,
        canEditOrders: true,
        canAdvanceStage: true,
        canAccessProductionStages: true,
        canAccessProductionFloor: true,
        canUploadArt: true,
        canApproveArt: true,
      };
    case 'Fulfillment':
      return {
        ...basePermissions,
        canEditOrders: true,
        canAdvanceStage: true,
        canAccessFulfillmentStages: true,
        canAccessFulfillmentTracking: true,
      };
    case 'ReadOnly':
      return {
        ...basePermissions,
        canViewReports: true,
        canAccessSalesStages: true,
        canAccessProductionStages: true,
        canAccessFulfillmentStages: true,
        canAccessProductionFloor: true,
        canAccessFulfillmentTracking: true,
      };
    default:
      return basePermissions;
  }
};

// Default (no user) permissions - nothing allowed
const getDefaultPermissions = (): Permissions => ({
  canManageUsers: false,
  canCreateUsers: false,
  canDeleteUsers: false,
  canImportUsers: false,
  canAccessSettings: false,
  canModifySettings: false,
  canCreateOrders: false,
  canEditOrders: false,
  canDeleteOrders: false,
  canAdvanceStage: false,
  canArchiveOrders: false,
  canAccessSalesStages: false,
  canAccessProductionStages: false,
  canAccessFulfillmentStages: false,
  canViewReports: false,
  canExportReports: false,
  canAccessProductionFloor: false,
  canAccessFulfillmentTracking: false,
  canUploadArt: false,
  canApproveArt: false,
});

// Check if user can access a specific stage
export const canAccessStage = (user: User | null, stage: string): boolean => {
  const permissions = getPermissions(user);

  // Sales stages
  const salesStages = ['Lead', 'Quote', 'Quote Approved', 'Paid'];
  if (salesStages.includes(stage)) {
    return permissions.canAccessSalesStages;
  }

  // Production stages
  const productionStages = ['Art Confirmation', 'Pre-Production', 'In Production', 'QC'];
  if (productionStages.includes(stage)) {
    return permissions.canAccessProductionStages;
  }

  // Fulfillment stages
  const fulfillmentStages = ['Ready To Ship', 'Closeout', 'Closed'];
  if (fulfillmentStages.includes(stage)) {
    return permissions.canAccessFulfillmentStages;
  }

  return false;
};

// Permission level display names
export const getPermissionLevelName = (level: PermissionLevel): string => {
  switch (level) {
    case 'owner':
      return 'Owner (Full Access)';
    case 'admin':
      return 'Admin/IT Support';
    case 'operator':
      return 'Operator';
    default:
      return 'Unknown';
  }
};
