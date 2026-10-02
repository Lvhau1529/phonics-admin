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
import { Button, Dropdown, Flex, Grid, Layout, Menu, theme, Typography, type MenuProps } from 'antd';
import { Suspense, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { activeMenuKey, menuForRole, type MenuEntry } from '@/app/layout/menu';
import { ROUTES } from '@/app/routes';
import { signOut } from '@/features/auth/authStore';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n';
import { THEME_COLORS } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { BrandMark } from '@/shared/ui/BrandMark';
import { LangSwitch } from '@/shared/ui/LangSwitch';
import { PageSkeleton } from '@/shared/ui/Loading';
import { RoleTag } from '@/shared/ui/RoleTag';
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch';

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

/**
 * Khung admin: sider + header (góc phải: ngôn ngữ, sáng / tối, user menu) + nội dung route
 * con trải hết chiều ngang còn lại.
 */
export function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = screens.lg === false;
  const mode = useThemeMode();
  const colors = THEME_COLORS[mode];
  const { token } = theme.useToken();

  const items: MenuProps['items'] = menuForRole(auth.role).map((entry) => ({
    key: entry.key,
    icon: ICONS[entry.icon],
    label: <Link to={entry.path}>{t.nav[entry.labelKey]}</Link>,
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
        width={232}
        collapsedWidth={isMobile ? 0 : 72}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
          borderRight: isMobile ? undefined : `1px solid ${colors.headerBorder}`,
        }}
      >
        <Flex
          align="center"
          justify={collapsed ? 'center' : 'flex-start'}
          gap={10}
          style={{
            height: 64,
            padding: collapsed ? 0 : '0 16px',
            borderBottom: `1px solid ${colors.headerBorder}`,
          }}
        >
          <BrandMark size={32} />
          {!collapsed && (
            <Typography.Text
              strong
              style={{
                color: colors.siderText,
                whiteSpace: 'nowrap',
                fontSize: 16,
              }}
            >
              {t.app.name}
            </Typography.Text>
          )}
        </Flex>
        <Menu
          mode="inline"
          selectedKeys={selected ? [selected] : []}
          items={items}
          style={{ paddingTop: 12, borderInlineEnd: 'none' }}
        />
      </Layout.Sider>
      <Layout style={{ minWidth: 0 }}>
        <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: `1px solid ${colors.headerBorder}`,
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
            <Typography.Text strong>{t.app.subtitle}</Typography.Text>
          </Flex>
          <Flex align="center" gap={isMobile ? 8 : 12}>
            <LangSwitch compact={isMobile} />
            <ThemeSwitch />
            {auth.user && (
              <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
                <Flex align="center" gap={8} style={{ cursor: 'pointer' }}>
                  <AvatarImg avatarKey={auth.user.avatarKey} name={auth.user.displayName} size="small" />
                  {!isMobile && <Typography.Text>{auth.user.displayName}</Typography.Text>}
                  {!isMobile && <RoleTag role={auth.user.role} />}
                </Flex>
              </Dropdown>
            )}
          </Flex>
        </Layout.Header>
        {/* Nội dung trải hết bề ngang còn lại (không giới hạn maxWidth → không bị dồn sang trái trên màn rộng) */}
        <Layout.Content
          style={{
            padding: isMobile ? 16 : 28,
            width: '100%',
            minWidth: 0,
            background: token.colorBgLayout,
          }}
        >
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
