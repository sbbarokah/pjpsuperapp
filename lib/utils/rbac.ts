// lib/utils/rbac.ts
import { UserRole } from "@/lib/types/user.types";

// 1. Cek Hak Mutasi (Create, Update, Delete)
export const canMutateData = (role: UserRole): boolean => {
  return ['superadmin', 'admin_desa', 'admin_kelompok'].includes(role);
};

export const isCanAccessFeature = (role: UserRole): boolean => {
  return ['admin_desa', 'admin_kelompok', 'pengurus_desa', 'pengurus_kelompok'].includes(role);
};

export const isVillageAdmin = (role: UserRole): boolean => {
  return ['admin_desa'].includes(role);
};

export const isGroupAdmin = (role: UserRole): boolean => {
  return ['admin_kelompok'].includes(role);
};

// 2. Cek Pengelompokan Level
export const isAdminLevel = (role: UserRole): boolean => {
  return ['admin_desa', 'admin_kelompok'].includes(role);
};

export const isPengurusLevel = (role: UserRole): boolean => {
  return ['pengurus_desa', 'pengurus_kelompok'].includes(role);
};

export const isVillageLevel = (role: UserRole): boolean => {
  return ['admin_desa', 'pengurus_desa'].includes(role);
};

export const isGroupLevel = (role: UserRole): boolean => {
  return ['admin_kelompok', 'pengurus_kelompok'].includes(role);
};

// 3. Cek Visibilitas Menu (Sesuai Syarat Anda)
export const canViewMenuMasterDesa = (role: UserRole): boolean => {
  return role === 'superadmin';
};

export const canViewMenuMasterKelompok = (role: UserRole): boolean => {
  return ['superadmin', 'admin_desa', 'pengurus_desa'].includes(role);
};

export const canViewMenuUsers = (role: UserRole): boolean => {
  return role === 'superadmin';
};

// Opsional: Helper untuk memvalidasi apakah sebuah role boleh dikelola
// (Berguna saat Superadmin ingin membuat/mengedit user)
export const isManageableRole = (role: UserRole): boolean => {
  const manageableRoles = [
    'admin_desa', 
    'pengurus_desa', 
    'admin_kelompok', 
    'pengurus_kelompok',
    'user'
  ];
  return manageableRoles.includes(role);
};