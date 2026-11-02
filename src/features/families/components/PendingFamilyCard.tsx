import { CheckOutlined, CloseOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Dropdown, Flex, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApproveFamilyBody } from '@phonics/contracts';
import { useState } from 'react';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { FamiliesService } from '@/features/families/api/familiesService';
import { RejectFamilyModal } from '@/features/families/components/RejectFamilyModal';
import type { PendingChildModel, PendingFamilyModel } from '@/features/families/models/PendingFamilyModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';
import { StatusTag } from '@/shared/ui/RoleTag';
import { formatDateTime } from '@/shared/utils/format';
import { parseForm } from '@/shared/utils/zodForm';

/**
 * Một đơn chờ duyệt: phụ huynh + các bé (chọn bé, chọn lớp duyệt vào — mặc định lớp đã đăng ký), cảnh báo trùng,
 * Duyệt / Từ chối / Gộp vào gia đình có sẵn.
 */
export function PendingFamilyCard({ family }: { family: PendingFamilyModel }) {
  const { message, modal } = App.useApp();
  const approve = FamiliesService.useApprove();
  const merge = FamiliesService.useMerge();
  const [selected, setSelected] = useState<string[]>(() => family.children.map((c) => c.studentId));
  const [classIds, setClassIds] = useState<Record<string, string | undefined>>(() =>
    Object.fromEntries(family.children.map((c) => [c.studentId, c.requestedClass?.id])),
  );
  // undefined = đóng; null = từ chối cả đơn; mảng = từ chối các bé đã chọn
  const [rejecting, setRejecting] = useState<string[] | null>();

  const handleApprove = async () => {
    if (selected.length === 0) return void message.warning(t.families.selectChildren);
    const children = selected.map((studentId) => ({ studentId, classId: classIds[studentId] }));
    if (children.some((c) => !c.classId)) return void message.warning(t.families.missingClass);
    const parsed = parseForm(ApproveFamilyBody, { children });
    if (!parsed.success) return void message.error(Object.values(parsed.fieldErrors).flat().join(' '));
    try {
      const res = await approve.mutateAsync({ id: family.id, body: parsed.data });
      message.success(t.families.approved(res.approved.length));
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const handleMerge = (guardianId: string, guardianName: string) => {
    modal.confirm({
      title: t.families.merge,
      content: t.families.mergeConfirm(guardianName),
      okText: t.common.confirm,
      cancelText: t.common.cancel,
      onOk: async () => {
        try {
          await merge.mutateAsync({ id: family.id, body: { guardianId } });
          message.success(t.families.merged);
        } catch (error) {
          message.error(errorMessage(error));
        }
      },
    });
  };

  const columns: ColumnsType<PendingChildModel> = [
    {
      title: t.common.student,
      key: 'name',
      render: (_, c) => (
        <Space>
          <AvatarImg avatarKey={c.avatarKey} name={c.displayName} size="small" />
          <Typography.Text strong>{c.fullName}</Typography.Text>
        </Space>
      ),
    },
    { title: t.families.requestedClass, key: 'requested', render: (_, c) => c.requestedClassText },
    {
      title: t.families.approveClass,
      key: 'class',
      render: (_, c) => (
        <ClassSelect
          size="small"
          value={classIds[c.studentId]}
          onChange={(v) => setClassIds((prev) => ({ ...prev, [c.studentId]: v }))}
        />
      ),
    },
    { title: t.families.registeredAt, key: 'createdAt', render: (_, c) => formatDateTime(c.createdAt) },
  ];

  const mergeTargets = family.mergeTargets;

  return (
    <Card
      size="small"
      title={
        <Space wrap>
          <Typography.Text strong>{family.title}</Typography.Text>
          {family.parent && <StatusTag status={family.parent.status} />}
        </Space>
      }
      extra={<Typography.Text type="secondary">{family.createdAtText}</Typography.Text>}
    >
      <Flex vertical gap={12}>
        {family.contactText && <Typography.Text>{family.contactText}</Typography.Text>}
        {family.duplicates.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={t.families.duplicates}
            description={
              <Flex vertical gap={2}>
                {family.duplicates.map((d, i) => (
                  <span key={`${d.kind}-${d.childId ?? ''}-${d.guardianId ?? d.studentId ?? i}`}>
                    {family.duplicateText(d)}
                  </span>
                ))}
              </Flex>
            }
          />
        )}
        <Table<PendingChildModel>
          size="small"
          rowKey="studentId"
          pagination={false}
          columns={columns}
          dataSource={family.children}
          rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
        />
        {family.otherChildren > 0 && (
          <Tag style={{ alignSelf: 'flex-start' }}>{t.families.otherChildren(family.otherChildren)}</Tag>
        )}
        <Flex gap={8} wrap justify="flex-end">
          {mergeTargets.length > 0 && (
            <Dropdown
              trigger={['click']}
              menu={{
                items: mergeTargets.map((m) => ({ key: m.guardianId, label: m.guardianName })),
                onClick: ({ key }) =>
                  handleMerge(key, mergeTargets.find((m) => m.guardianId === key)?.guardianName ?? key),
              }}
            >
              <Button icon={<MergeCellsOutlined />} loading={merge.isPending}>
                {t.families.merge}
              </Button>
            </Dropdown>
          )}
          <Button danger icon={<CloseOutlined />} onClick={() => setRejecting(null)}>
            {t.families.rejectAll}
          </Button>
          <Button
            danger
            disabled={selected.length === 0 || selected.length === family.children.length}
            onClick={() => setRejecting(selected)}
          >
            {t.families.rejectSelected(selected.length)}
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            disabled={selected.length === 0}
            loading={approve.isPending}
            onClick={() => void handleApprove()}
          >
            {t.families.approveCount(selected.length)}
          </Button>
        </Flex>
      </Flex>
      {rejecting !== undefined && (
        <RejectFamilyModal
          familyId={family.id}
          studentIds={rejecting ?? undefined}
          onClose={() => setRejecting(undefined)}
        />
      )}
    </Card>
  );
}
