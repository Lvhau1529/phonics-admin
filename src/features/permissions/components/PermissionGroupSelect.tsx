import { Select, Tag, type SelectProps } from 'antd';
import { usePermissionGroups } from '@/features/permissions/hooks';
import { t } from '@/shared/i18n';

type PermissionGroupSelectProps = Omit<SelectProps<string[]>, 'options' | 'loading' | 'mode'>;

/** Ô chọn nhiều nhóm quyền (ADMIN) — dùng ở trang Phân quyền và form giáo viên */
export function PermissionGroupSelect(props: PermissionGroupSelectProps) {
  const { data, isLoading } = usePermissionGroups();
  const options = (data ?? []).map((g) => ({
    value: g.id,
    label: g.name,
    title: g.description ?? undefined,
    isSystem: g.isSystem,
  }));
  return (
    <Select<string[]>
      mode="multiple"
      allowClear
      optionFilterProp="label"
      placeholder={t.permissions.userGroupsPlaceholder}
      style={{ minWidth: 280 }}
      maxTagCount="responsive"
      {...props}
      loading={isLoading}
      options={options}
      optionRender={(option) => (
        <span>
          {option.label}
          {option.data.isSystem && (
            <Tag color="gold" style={{ marginLeft: 8 }}>
              {t.permissions.systemGroup}
            </Tag>
          )}
        </span>
      )}
    />
  );
}
