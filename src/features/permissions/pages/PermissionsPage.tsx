import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router';
import { PermissionGroupsTab } from '@/features/permissions/components/PermissionGroupsTab';
import { UserPermissionsTab } from '@/features/permissions/components/UserPermissionsTab';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';

type TabKey = 'groups' | 'users';

/** Trang Phân quyền (ADMIN): tab Nhóm quyền (vai trò tuỳ biến) + tab Theo giáo viên (ma trận quyền). URL: ?tab=&userId= */
export function PermissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId') ?? undefined;
  // Có userId (link từ nơi khác) → mở thẳng tab giáo viên
  const tab: TabKey = searchParams.get('tab') === 'users' || userId ? 'users' : 'groups';

  const setParams = (next: { tab: TabKey; userId?: string }) => {
    const params = new URLSearchParams();
    params.set('tab', next.tab);
    if (next.userId) params.set('userId', next.userId);
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <PageHeader title={t.permissions.title} />
      <Tabs
        activeKey={tab}
        onChange={(key) => setParams({ tab: key as TabKey, userId: key === 'users' ? userId : undefined })}
        destroyOnHidden
        items={[
          {
            key: 'groups',
            label: t.permissions.tabGroups,
            icon: <TeamOutlined />,
            children: <PermissionGroupsTab />,
          },
          {
            key: 'users',
            label: t.permissions.tabUsers,
            icon: <UserOutlined />,
            children: (
              <UserPermissionsTab
                userId={userId}
                onUserChange={(id) => setParams({ tab: 'users', userId: id })}
              />
            ),
          },
        ]}
      />
    </>
  );
}

export default PermissionsPage;
