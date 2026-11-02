import { Alert, App, Button, Flex, Modal, Space, Table, Tag, Typography } from 'antd';
import {
  ConvertFamilyBody,
  studentFullName,
  type ConvertPreview,
  type ConvertPreviewStudent,
} from '@phonics/contracts';
import { useState } from 'react';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import type { GuardianModel } from '@/features/guardians/models/GuardianModel';
import { StudentSearchSelect } from '@/features/students/components/StudentSearchSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { parseForm } from '@/shared/utils/zodForm';

interface ConvertFamilyModalProps {
  /** Mở modal khi có phụ huynh; đặt `key` theo id để mỗi lần mở là trạng thái mới */
  guardian: GuardianModel | undefined;
  onClose: () => void;
}

const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * Chuyển học sinh đang tự đăng nhập sang tài khoản gia đình: chọn học sinh → Xem trước (chế độ tài khoản, học sinh
 * nào mất đăng nhập riêng, lý do chặn) → Chuyển đổi. Đổi danh sách sau khi xem trước thì phải xem lại.
 */
export function ConvertFamilyModal({ guardian, onClose }: ConvertFamilyModalProps) {
  const { message } = App.useApp();
  const initial = guardian?.ownLoginChildren ?? [];
  const [studentIds, setStudentIds] = useState<string[]>(initial.map((c) => c.studentId));
  const [preview, setPreview] = useState<{ ids: string[]; data: ConvertPreview }>();
  const [error, setError] = useState<string>();
  const previewMutation = GuardiansService.useConvertPreview();
  const convert = GuardiansService.useConvert();

  if (!guardian) return null;
  const stale = !!preview && !sameIds(preview.ids, studentIds);
  const canConvert = !!preview && !stale && preview.data.blockers.length === 0;

  const body = () => {
    const parsed = parseForm(ConvertFamilyBody, { studentIds });
    if (!parsed.success) {
      setError([...parsed.formErrors, ...Object.values(parsed.fieldErrors).flat()].join(' '));
      return null;
    }
    setError(undefined);
    return parsed.data;
  };

  const runPreview = async () => {
    const data = body();
    if (!data) return;
    try {
      setPreview({
        ids: data.studentIds,
        data: await previewMutation.mutateAsync({ id: guardian.id, body: data }),
      });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const runConvert = async () => {
    const data = body();
    if (!data) return;
    try {
      const res = await convert.mutateAsync({ id: guardian.id, body: data });
      message.success(
        res.inviteSent ? `${t.guardians.converted}. ${t.guardians.inviteSent}` : t.guardians.converted,
      );
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const columns = [
    {
      title: t.guardians.convertStudents,
      key: 'name',
      render: (_: unknown, s: ConvertPreviewStudent) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{studentFullName(s)}</Typography.Text>
          <Typography.Text type="secondary">{s.email ?? t.loginMode[s.loginMode]}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t.common.status,
      key: 'flags',
      render: (_: unknown, s: ConvertPreviewStudent) => (
        <Flex gap={4} wrap>
          {s.movesCredentials && <Tag color="processing">{t.guardians.movesCredentials}</Tag>}
          {s.losesOwnLogin && <Tag color="warning">{t.guardians.losesOwnLogin}</Tag>}
          {s.alreadyLinked && <Tag>{t.guardians.alreadyLinked}</Tag>}
        </Flex>
      ),
    },
  ];

  return (
    <Modal
      open
      onCancel={onClose}
      title={t.guardians.convertTitle(guardian.fullName)}
      width={640}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button loading={previewMutation.isPending} onClick={() => void runPreview()}>
            {t.guardians.preview}
          </Button>
          <Button
            type="primary"
            disabled={!canConvert}
            loading={convert.isPending}
            onClick={() => void runConvert()}
          >
            {t.guardians.convertConfirm}
          </Button>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t.guardians.convertIntro}
        </Typography.Paragraph>
        <StudentSearchSelect
          value={studentIds}
          onChange={setStudentIds}
          initialOptions={initial.map((c) => ({ value: c.studentId, label: c.fullName }))}
        />
        {error && <Alert type="error" showIcon message={error} />}
        {stale && <Alert type="info" showIcon message={t.guardians.previewStale} />}
        {preview && !stale && (
          <>
            <Alert type="info" showIcon message={t.guardians.accountMode[preview.data.account]} />
            {preview.data.blockers.map((b) => (
              <Alert key={b} type="error" showIcon message={t.guardians.blockers[b]} />
            ))}
            <Table<ConvertPreviewStudent>
              size="small"
              rowKey="studentId"
              pagination={false}
              columns={columns}
              dataSource={preview.data.students}
            />
          </>
        )}
      </Flex>
    </Modal>
  );
}
