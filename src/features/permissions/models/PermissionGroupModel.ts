import type { Permission, PermissionGroup } from '@phonics/contracts';

/** Nhóm quyền (từ `PermissionGroup` của BE) */
export class PermissionGroupModel {
  readonly id: string;
  readonly name: string;
  readonly permissions: Permission[];
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly memberCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(data: PermissionGroup) {
    this.id = data.id;
    this.name = data.name;
    this.permissions = data.permissions;
    this.description = data.description;
    this.isSystem = data.isSystem;
    this.memberCount = data.memberCount;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /** Nhóm hệ thống (seed) không xoá được, vẫn sửa được quyền */
  get canDelete(): boolean {
    return !this.isSystem;
  }
}
