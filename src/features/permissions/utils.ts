import type { Permission, PermissionDefView, UserPermissionsResponse } from '@phonics/contracts';
import { t } from '@/shared/i18n';

export type PermissionArea = keyof typeof t.permissions.area;

/** `games.unlock` → 'games' (prefix trước dấu chấm); prefix lạ → 'other' */
export function permissionArea(code: string): PermissionArea {
  const prefix = code.split('.')[0];
  return prefix in t.permissions.area ? (prefix as PermissionArea) : 'other';
}

/** Gom catalog theo khu vực, giữ thứ tự xuất hiện */
export function groupByArea(
  catalog: readonly PermissionDefView[],
): { area: PermissionArea; items: PermissionDefView[] }[] {
  const map = new Map<PermissionArea, PermissionDefView[]>();
  for (const def of catalog) {
    const area = permissionArea(def.code);
    const list = map.get(area);
    if (list) list.push(def);
    else map.set(area, [def]);
  }
  return [...map.entries()].map(([area, items]) => ({ area, items }));
}

/** Mô tả quyền theo ngôn ngữ; thiếu thì dùng mô tả (tiếng Việt) từ contracts */
export const permissionDescription = (def: PermissionDefView): string =>
  t.permissionDescription[def.code] ?? def.description;

/** Nguồn của quyền hiệu lực (cột "Nguồn" trong ma trận): ghi đè > mặc định role > nhóm > không có */
export type PermissionSource =
  | { kind: 'granted' }
  | { kind: 'revoked' }
  | { kind: 'default' }
  | { kind: 'group'; names: string[] }
  | { kind: 'none' };

export function permissionSource(data: UserPermissionsResponse, code: Permission): PermissionSource {
  const override = data.overrides.find((o) => o.permission === code);
  if (override) return { kind: override.effect === 'GRANT' ? 'granted' : 'revoked' };
  if (data.defaults.includes(code)) return { kind: 'default' };
  const names = data.groups.filter((g) => g.permissions.includes(code)).map((g) => g.name);
  if (names.length > 0) return { kind: 'group', names };
  return { kind: 'none' };
}
