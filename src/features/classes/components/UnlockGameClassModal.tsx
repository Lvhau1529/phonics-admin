import { App, Form, Input, Modal, Typography } from 'antd';
import { UnlockClassBody, type GameId } from '@phonics/contracts';
import { useEffect } from 'react';
import { useUnlockClassGame } from '@/features/classes/hooks';
import type { ClassModel } from '@/features/classes/models/ClassModel';
import { GameSelect } from '@/features/games/components/GameSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty } from '@/shared/utils/zodForm';

interface UnlockFormValues {
  gameId?: GameId;
  note?: string;
}

interface UnlockGameClassModalProps {
  cls: ClassModel;
  open: boolean;
  onClose: () => void;
  /** Game chọn sẵn (từ bảng game của lớp) */
  gameId?: GameId;
}

/** Mở khoá một game cho mọi học sinh trong lớp (quyền games.unlock) */
export function UnlockGameClassModal({ cls, open, onClose, gameId }: UnlockGameClassModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UnlockFormValues>();
  const unlock = useUnlockClassGame(cls.id);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ gameId });
    }
  }, [open, gameId, form]);

  const handleFinish = async (raw: UnlockFormValues) => {
    if (!raw.gameId) return applyFieldErrors(form, { gameId: [t.common.requiredField] });
    const parsed = parseForm(UnlockClassBody, stripEmpty({ classId: cls.id, note: raw.note }));
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      const result = await unlock.mutateAsync({ gameId: raw.gameId, body: parsed.data });
      message.success(t.classes.unlockResult(result.unlocked, result.alreadyUnlocked));
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={unlock.isPending}
      title={t.classes.unlockGameTitle(cls.name)}
      okText={t.classes.unlockGame}
      cancelText={t.common.cancel}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">{t.classes.unlockGameHint}</Typography.Paragraph>
      <Form<UnlockFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="gameId"
          label={t.common.game}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <GameSelect allowClear={false} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label={`${t.common.note} ${t.common.optional}`}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
