import { App, Button, Card, Empty, Flex, Input, Segmented, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SetUserPermissionGroupsBody,
  UpdateUserPermissionsBody,
  type Permission,
  type PermissionDefView,
  type Role,
} from '@phonics/contracts';
import { useMemo, useState } from 'react';
import { permissionDescription, permissionSource, type PermissionSource } from '@/features/permissions/utils';
import { PermissionGroupSelect } from '@/features/permissions/components/PermissionGroupSelect';
import {
  usePermissionCatalog,
  useSetUserPermissionGroups,
  useUpdateUserPermissions,
  useUserPermissions,
} from '@/features/permissions/hooks';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { formatDateTime } from '@/shared/utils/format';

/** Trạng thái một quyền của user: mặc định theo role / ghi đè cấp / ghi đè thu hồi */
type State = 'default' | 'granted' | 'revoked';

function SourceTag({ source }: { source: PermissionSource }) {
  switch (source.kind) {
    case 'granted':
      return <Tag color="green">{t.permissions.sourceGranted}</Tag>;
    case 'revoked':
      return <Tag color="red">{t.permissions.sourceRevoked}</Tag>;
    case 'default':
      return <Tag color="blue">{t.permissions.sourceDefault}</Tag>;
    case 'group':
      return (
        <Flex gap={4} wrap>
          {source.names.map((name) => (
            <Tag key={name} color="gold" style={{ marginInlineEnd: 0 }}>
              {t.permissions.sourceGroup(name)}
            </Tag>
          ))}
        </Flex>
      );
    default:
      return <Typography.Text type="secondary">{t.permissions.sourceNone}</Typography.Text>;
  }
}

interface UserPermissionsTabProps {
  userId: string | undefined;
  onUserChange: (userId: string | undefined) => void;
}

/** Tab Theo giáo viên: chọn GV → gán nhóm quyền + ma trận mặc định / cấp / thu hồi, cột nguồn & hiệu lực */
export function UserPermissionsTab({ userId, onUserChange }: UserPermissionsTabProps) {
  const { message } = App.useApp();
  const catalog = usePermissionCatalog();
  const userPerms = useUserPermissions(userId);
  const update = useUpdateUserPermissions();
  const setGroups = useSetUserPermissionGroups();
  const [draft, setDraft] = useState<Partial<Record<Permission, State>>>({});
  const [note, setNote] = useState('');
  const [groupDraft, setGroupDraft] = useState<string[] | null>(null);

  const stateLabels: Record<State, string> = {
    default: t.permissions.stateDefault,
    granted: t.permissions.stateGranted,
    revoked: t.permissions.stateRevoked,
  };

  const selectUser = (next: string | undefined) => {
    setDraft({});
    setGroupDraft(null);
    onUserChange(next);
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

  const serverGroupIds = useMemo(() => userPerms.data?.groups.map((g) => g.id) ?? [], [userPerms.data]);
  const groupIds = groupDraft ?? serverGroupIds;
  const groupsChanged =
    groupDraft !== null &&
    (groupDraft.length !== serverGroupIds.length || groupDraft.some((id) => !serverGroupIds.includes(id)));

  const handleSaveGroups = async () => {
    if (!userId || groupDraft === null) return;
    const parsed = SetUserPermissionGroupsBody.safeParse({ groupIds: groupDraft });
    if (!parsed.success)
      return void message.error(parsed.error.issues[0]?.message ?? t.errors.VALIDATION_ERROR);
    try {
      await setGroups.mutateAsync({ userId, body: parsed.data });
      setGroupDraft(null);
      message.success(t.permissions.userGroupsSaved);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

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
      render: (code: Permission, def) => (
        <Flex vertical gap={0}>
          <Typography.Text strong>{t.permissionLabel[code]}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {permissionDescription(def)}
          </Typography.Text>
          <Typography.Text type="secondary" code style={{ fontSize: 11 }}>
            {code}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: t.permissions.defaultForRole,
      dataIndex: 'defaultRoles',
      align: 'center',
      width: 120,
      render: (roles: Role[]) =>
        role && roles.includes(role) ? <Tag color="green">{t.common.yes}</Tag> : <Tag>{t.common.no}</Tag>,
    },
    {
      title: t.permissions.source,
      key: 'source',
      width: 200,
      render: (_, def) =>
        userPerms.data ? <SourceTag source={permissionSource(userPerms.data, def.code)} /> : null,
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
                label: stateLabels[s],
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
      width: 100,
      render: (_, def) =>
        userPerms.data?.effective.includes(def.code) ? (
          <Tag color="gold">{t.common.yes}</Tag>
        ) : (
          <Tag>{t.common.no}</Tag>
        ),
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap align="center">
        <TeacherSelect
          remoteSearch
          value={userId}
          onChange={(v) => selectUser(v as string | undefined)}
          placeholder={t.permissions.pickTeacher}
          style={{ minWidth: 320 }}
        />
        <Typography.Text type="secondary">{t.permissions.legend}</Typography.Text>
      </Flex>
      <ErrorAlert
        error={catalog.error ?? userPerms.error}
        onRetry={() => void (catalog.error ? catalog.refetch() : userPerms.refetch())}
      />
      {!userId ? (
        <Empty description={t.permissions.pickTeacherHint} />
      ) : (
        <Card>
          <Flex vertical gap={6} style={{ marginBottom: 16 }}>
            <Typography.Text strong>{t.permissions.userGroups}</Typography.Text>
            <Flex gap={8} wrap align="center">
              <PermissionGroupSelect
                value={groupIds}
                onChange={(ids) => setGroupDraft(ids)}
                disabled={!userPerms.data}
                style={{ minWidth: 320, flex: '1 1 320px', maxWidth: 560 }}
              />
              <Button
                type="primary"
                disabled={!groupsChanged}
                loading={setGroups.isPending}
                onClick={handleSaveGroups}
              >
                {t.common.save}
              </Button>
              <Button disabled={!groupsChanged} onClick={() => setGroupDraft(null)}>
                {t.common.reset}
              </Button>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t.teachers.groupsHint}
            </Typography.Text>
          </Flex>
          <DataTable.Static<PermissionDefView>
            rowKey="code"
            columns={columns}
            dataSource={catalog.data}
            loading={catalog.isLoading || userPerms.isFetching}
            pagination={false}
            scroll={{ x: 'max-content' }}
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
    </Flex>
  );
}
