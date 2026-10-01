import { Button, Checkbox, Flex, Typography } from 'antd';
import type { Permission, PermissionDefView } from '@phonics/contracts';
import { useMemo } from 'react';
import { groupByArea, permissionDescription } from '@/features/permissions/utils';
import { t } from '@/shared/i18n';

interface PermissionChecklistProps {
  catalog: readonly PermissionDefView[];
  /** Tương thích antd Form.Item (value / onChange) */
  value?: Permission[];
  onChange?: (value: Permission[]) => void;
  disabled?: boolean;
}

/** Danh sách quyền theo khu vực (class.*, points.*…) — Checkbox.Group, có chọn / bỏ cả khu vực */
export function PermissionChecklist({ catalog, value = [], onChange, disabled }: PermissionChecklistProps) {
  const groups = useMemo(() => groupByArea(catalog), [catalog]);
  const selected = new Set(value);

  // Giữ thứ tự catalog để body ổn định
  const emit = (next: Set<Permission>) => onChange?.(catalog.map((d) => d.code).filter((c) => next.has(c)));

  const setMany = (codes: Permission[], checked: boolean) => {
    const next = new Set(selected);
    for (const code of codes) {
      if (checked) next.add(code);
      else next.delete(code);
    }
    emit(next);
  };

  return (
    <Flex vertical gap={16}>
      {groups.map(({ area, items }) => {
        const codes = items.map((d) => d.code);
        const allChecked = codes.every((c) => selected.has(c));
        return (
          <div key={area}>
            <Flex align="center" justify="space-between" style={{ marginBottom: 6 }}>
              <Typography.Text strong>{t.permissions.area[area]}</Typography.Text>
              {!disabled && (
                <Button type="link" size="small" onClick={() => setMany(codes, !allChecked)}>
                  {allChecked ? t.common.clearAll : t.common.selectAll}
                </Button>
              )}
            </Flex>
            <Checkbox.Group
              value={codes.filter((c) => selected.has(c))}
              onChange={(checked) => {
                const set = new Set(checked as Permission[]);
                const next = new Set(selected);
                for (const code of codes) {
                  if (set.has(code)) next.add(code);
                  else next.delete(code);
                }
                emit(next);
              }}
              disabled={disabled}
              style={{ width: '100%' }}
            >
              <Flex vertical gap={6}>
                {items.map((def) => (
                  <Checkbox key={def.code} value={def.code}>
                    <Typography.Text>{t.permissionLabel[def.code]}</Typography.Text>
                    <Typography.Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                      {permissionDescription(def)}
                    </Typography.Text>
                  </Checkbox>
                ))}
              </Flex>
            </Checkbox.Group>
          </div>
        );
      })}
    </Flex>
  );
}
