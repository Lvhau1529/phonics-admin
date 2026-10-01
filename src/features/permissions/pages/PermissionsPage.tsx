import { App, Button, Card, Empty, Flex, Input, Segmented, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UpdateUserPermissionsBody,
  type Permission,
  type PermissionDefView,
  type Role,
} from '@phonics/contracts';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  usePermissionCatalog,
  useUpdateUserPermissions,
  useUserPermissions,
} from '@/features/permissions/hooks';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { formatDateTime } from '@/shared/utils/format';

/** Trạng thái một quyền của user: mặc định theo role / ghi đè cấp / ghi đè thu hồi */
type State = 'default' | 'granted' | 'revoked';

const STATE_LABELS: Record<State, string> = {
  default: t.permissions.stateDefault,
  granted: t.permissions.stateGranted,
  revoked: t.permissions.stateRevoked,
};

/** Ma trận quyền của một giáo viên: chọn mặc định / cấp / thu hồi từng quyền rồi lưu một lần */
export function PermissionsPage() {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId') ?? undefined;
  const catalog = usePermissionCatalog();
  const userPerms = useUserPermissions(userId);
  const update = useUpdateUserPermissions();
  const [draft, setDraft] = useState<Partial<Record<Permission, State>>>({});
  const [note, setNote] = useState('');

  const setUserId = (next: string | undefined) => {
    setDraft({});
    setSearchParams(next ? new URLSearchParams({ userId: next }) : new URLSearchParams(), { replace: true });
  };

  /** Trạng thái hiện tại trên server của từng quyền */
  const serverState = useMemo(() => {
    const map: Partial<Record<Permission, State>> = {};
    for (const o of userPerms.data?.overrides ?? [])
      map[o.permission] = o.effect === 'GRANT' ? 'granted' : 'revoked';
    return map;
  }, [userPerms.data]);

  const stateOf = (code: Permission): State => draft[code] ?? serverState[code] ?? 'default';
  const changed = (Object.keys(draft) as Permission[]).filter(
    (code) => draft[code] !== (serverState[code] ?? 'default'),
  );

  const handleSave = async () => {
    if (!userId || !userPerms.data) return;
    const body = {
      grant: changed.filter((c) => draft[c] === 'granted'),
      revoke: changed.filter((c) => draft[c] === 'revoked'),
      reset: changed.filter((c) => draft[c] === 'default'),
      note: note.trim() || undefined,
    };
    const parsed = UpdateUserPermissionsBody.safeParse(body);
    if (!parsed.success)
      return void message.error(parsed.error.issues[0]?.message ?? t.errors.VALIDATION_ERROR);
    try {
      await update.mutateAsync({ userId, body: parsed.data });
      setDraft({});
      setNote('');
      message.success(t.permissions.saved);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const role: Role | undefined = userPerms.data?.role;
  const columns: ColumnsType<PermissionDefView> = [
    {
      title: t.permissions.permission,
      dataIndex: 'code',
      render: (code: Permission) => (
        <>
          <Typography.Text strong>{t.permissionLabel[code]}</Typography.Text>
          <br />
          <Typography.Text type="secondary" code>
            {code}
          </Typography.Text>
        </>
      ),
    },
    { title: t.permissions.description, dataIndex: 'description' },
    {
      title: t.permissions.defaultForRole,
      dataIndex: 'defaultRoles',
      align: 'center',
      render: (roles: Role[]) =>
        role && roles.includes(role) ? <Tag color="green">{t.common.yes}</Tag> : <Tag>{t.common.no}</Tag>,
    },
    {
      title: t.permissions.state,
      key: 'state',
      render: (_, def) => {
        const override = userPerms.data?.overrides.find((o) => o.permission === def.code);
        return (
          <Flex vertical gap={4}>
            <Segmented<State>
              size="small"
              value={stateOf(def.code)}
              onChange={(v) => setDraft((d) => ({ ...d, [def.code]: v }))}
              options={(['default', 'granted', 'revoked'] as State[]).map((s) => ({
                value: s,
                label: STATE_LABELS[s],
              }))}
            />
            {override && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.permissions.overrideBy(
                  override.grantedByName ?? t.points.system,
                  formatDateTime(override.createdAt),
                )}
                {override.note ? ` · ${override.note}` : ''}
              </Typography.Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: t.permissions.effective,
      key: 'effective',
      align: 'center',
      render: (_, def) =>
        userPerms.data?.effective.includes(def.code) ? (
          <Tag color="purple">{t.common.yes}</Tag>
        ) : (
          <Tag>{t.common.no}</Tag>
        ),
    },
  ];

  return (
    <>
      <PageHeader title={t.permissions.title} subtitle={t.permissions.legend}>
        <Flex gap={8} wrap align="center">
          <TeacherSelect
            remoteSearch
            value={userId}
            onChange={(v) => setUserId(v as string | undefined)}
            placeholder={t.permissions.pickTeacher}
            style={{ minWidth: 320 }}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert
        error={catalog.error ?? userPerms.error}
        onRetry={() => void (catalog.error ? catalog.refetch() : userPerms.refetch())}
      />
      {!userId ? (
        <Empty description={t.permissions.pickTeacherHint} />
      ) : (
        <Card>
          <Table<PermissionDefView>
            rowKey="code"
            size="middle"
            columns={columns}
            dataSource={catalog.data}
            loading={catalog.isLoading || userPerms.isLoading}
            pagination={false}
          />
          <Flex gap={8} wrap align="center" style={{ marginTop: 16 }}>
            <Input
              placeholder={t.permissions.noteLabel}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              style={{ maxWidth: 360 }}
            />
            <Button
              type="primary"
              disabled={changed.length === 0}
              loading={update.isPending}
              onClick={handleSave}
            >
              {t.common.save} {changed.length > 0 ? `(${changed.length})` : ''}
            </Button>
            <Button disabled={changed.length === 0} onClick={() => setDraft({})}>
              {t.common.reset}
            </Button>
          </Flex>
        </Card>
      )}
    </>
  );
}

export default PermissionsPage;
