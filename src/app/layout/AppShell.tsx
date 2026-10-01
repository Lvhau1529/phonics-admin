import {
  AuditOutlined,
  BarChartOutlined,
  DashboardOutlined,
  FileExcelOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Flex, Grid, Layout, Menu, Typography, type MenuProps } from 'antd';
import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { activeMenuKey, menuForRole, type MenuEntry } from '@/app/layout/menu';
import { ROUTES } from '@/app/routes';
import { signOut } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n/vi';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { RoleTag } from '@/shared/ui/RoleTag';

const ICONS: Record<MenuEntry['icon'], ReactNode> = {
  dashboard: <DashboardOutlined />,
  teacher: <UserOutlined />,
  class: <ReadOutlined />,
  student: <TeamOutlined />,
  game: <TrophyOutlined />,
  points: <BarChartOutlined />,
  permission: <SafetyCertificateOutlined />,
  audit: <AuditOutlined />,
  report: <FileExcelOutlined />,
};

/** Khung admin: sider tím + header (user menu) + nội dung route con */
export function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = screens.lg === false;

  const items: MenuProps['items'] = menuForRole(auth.role).map((entry) => ({
    key: entry.key,
    icon: ICONS[entry.icon],
    label: <Link to={entry.path}>{entry.label}</Link>,
  }));
  const selected = activeMenuKey(location.pathname);

  const userMenu: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: t.nav.profile, onClick: () => navigate(ROUTES.profile) },
    { type: 'divider' },
    { key: 'signout', icon: <LogoutOutlined />, label: t.nav.signOut, onClick: () => void signOut() },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={isMobile ? true : collapsed}
        trigger={null}
        breakpoint="lg"
        width={220}
        collapsedWidth={isMobile ? 0 : 64}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
      >
        <Flex align="center" gap={8} style={{ height: 56, padding: '0 16px', color: '#fff' }}>
          <TrophyOutlined style={{ fontSize: 22 }} />
          {!collapsed && (
            <Typography.Text strong style={{ color: '#fff', whiteSpace: 'nowrap' }}>
              {t.app.name}
            </Typography.Text>
          )}
        </Flex>
        <Menu theme="dark" mode="inline" selectedKeys={selected ? [selected] : []} items={items} />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Flex align="center" gap={8}>
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? t.common.expand : t.common.collapse}
              />
            )}
            {isMobile && (
              <Dropdown menu={{ items, selectedKeys: selected ? [selected] : [] }} trigger={['click']}>
                <Button type="text" icon={<MenuUnfoldOutlined />} aria-label={t.common.expand} />
              </Dropdown>
            )}
            <Typography.Text type="secondary">{t.app.subtitle}</Typography.Text>
          </Flex>
          {auth.user && (
            <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
              <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
                <AvatarImg avatarKey={auth.user.avatarKey} name={auth.user.displayName} size="small" />
                <Typography.Text>{auth.user.displayName}</Typography.Text>
                <RoleTag role={auth.user.role} />
              </Flex>
            </Dropdown>
          )}
        </Layout.Header>
        <Layout.Content style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, width: '100%' }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
