import type {
  Permission,
  PermissionGroupRef,
  PermissionOverride,
  Role,
  UserPermissionsResponse,
} from '@phonics/contracts';
import { permissionSource, type PermissionSource } from '@/features/permissions/utils';

/** Ma trận quyền của một user (từ `UserPermissionsResponse` của BE) + tra cứu theo mã quyền */
export class UserPermissionsModel {
  readonly userId: string;
  readonly role: Role;
  readonly defaults: Permission[];
  readonly groups: PermissionGroupRef[];
  readonly fromGroups: Permission[];
  readonly overrides: PermissionOverride[];
  readonly effective: Permission[];

  constructor(data: UserPermissionsResponse) {
    this.userId = data.userId;
    this.role = data.role;
    this.defaults = data.defaults;
    this.groups = data.groups;
    this.fromGroups = data.fromGroups;
    this.overrides = data.overrides;
    this.effective = data.effective;
  }

  get groupIds(): string[] {
    return this.groups.map((group) => group.id);
  }

  /** Ghi đè riêng (GRANT / REVOKE) của quyền này, nếu có */
  overrideOf(code: Permission): PermissionOverride | undefined {
    return this.overrides.find((override) => override.permission === code);
  }

  /** Quyền hiệu lực (server đã tính: mặc định + nhóm + GRANT - REVOKE) */
  has(code: Permission): boolean {
    return this.effective.includes(code);
  }

  /** Nguồn của quyền cho cột "Nguồn": ghi đè > mặc định role > nhóm > không có */
  sourceOf(code: Permission): PermissionSource {
    return permissionSource(this, code);
  }
}
