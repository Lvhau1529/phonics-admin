import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Form, Input, InputNumber, Modal, Segmented, Typography } from 'antd';
import { AwardBonusBatchBody, AwardBonusBody, BonusPoints, type GameId } from '@phonics/contracts';
import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { useAwardBonus, useAwardBonusBatch } from '@/features/classes/hooks';
import { StudentSelect } from '@/features/students/components/StudentSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { GameSelect } from '@/shared/ui/GameSelect';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';

type Mode = 'single' | 'batch';

interface BonusEntryValues {
  studentId?: string;
  points?: number;
  note?: string;
  gameId?: GameId;
}

interface BonusFormValues extends BonusEntryValues {
  entries?: BonusEntryValues[];
}

interface BonusPointsModalProps {
  classId: string;
  open: boolean;
  onClose: () => void;
  /** Mở sẵn chế độ một học sinh với học sinh này */
  studentId?: string;
  initialMode?: Mode;
}

/**
 * Cộng (hoặc trừ) điểm thưởng: một học sinh hoặc hàng loạt (bảng nhập nhiều dòng).
 * Modal `destroyOnHidden` nên form bên trong mount lại mỗi lần mở → không cần reset bằng effect.
 */
export function BonusPointsModal({ open, onClose, ...formProps }: BonusPointsModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t.classes.bonusTitle}
      footer={null}
      width={880}
      destroyOnHidden
    >
      <BonusPointsForm {...formProps} onClose={onClose} />
    </Modal>
  );
}

type BonusPointsFormProps = Omit<BonusPointsModalProps, 'open'>;

function BonusPointsForm({ classId, onClose, studentId, initialMode = 'single' }: BonusPointsFormProps) {
  const { message } = App.useApp();
  const auth = useAuth();
  const [form] = Form.useForm<BonusFormValues>();
  const [mode, setMode] = useState<Mode>(studentId ? 'single' : initialMode);
  const single = useAwardBonus(classId);
  const batch = useAwardBonusBatch(classId);
  const canRevoke = auth.can('points.revoke');
  const saving = single.isPending || batch.isPending;

  const pointsRule = zodRule(BonusPoints);

  const handleFinish = async (raw: BonusFormValues) => {
    try {
      if (mode === 'single') {
        const values = stripEmpty({
          studentId: raw.studentId,
          points: raw.points,
          note: raw.note,
          gameId: raw.gameId,
        });
        const parsed = parseForm(AwardBonusBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        const result = await single.mutateAsync(parsed.data);
        message.success(
          `${t.classes.bonusDone(1)} · ${t.classes.bonusRank(result.rank.previous, result.rank.current)}`,
        );
      } else {
        const entries = (raw.entries ?? []).map((e) => stripEmpty({ ...e }));
        const parsed = parseForm(AwardBonusBatchBody, { entries });
        if (!parsed.success) {
          // Lỗi theo dòng: entries.0.points → name ['entries', 0, 'points']
          applyFieldErrors(form, parsed.fieldErrors);
          if (parsed.formErrors.length) message.error(parsed.formErrors[0]);
          return;
        }
        const result = await batch.mutateAsync(parsed.data);
        message.success(t.classes.bonusDone(result.entries.length));
      }
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Flex vertical gap={12}>
      {!studentId && (
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'single', label: t.classes.bonusSingle },
            { value: 'batch', label: t.classes.bonusBatch },
          ]}
        />
      )}
      <Typography.Text type="secondary">{t.classes.bonusHint}</Typography.Text>
      <Form<BonusFormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ studentId, entries: [{}] }}
      >
        {mode === 'single' ? (
          <>
            <Form.Item
              name="studentId"
              label={t.common.student}
              rules={[{ required: true, message: t.common.requiredField }]}
            >
              <StudentSelect classId={classId} disabled={!!studentId} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="points"
              label={t.classes.bonusPoints}
              rules={[{ required: true, message: t.common.requiredField }, pointsRule]}
            >
              <InputNumber min={canRevoke ? -100 : 1} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="note"
              label={t.classes.bonusNote}
              rules={[{ required: true, message: t.common.requiredField }]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="gameId" label={t.classes.bonusGame}>
              <GameSelect style={{ width: '100%' }} />
            </Form.Item>
          </>
        ) : (
          <Form.List name="entries">
            {(fields, { add, remove }) => (
              <Flex vertical gap={4}>
                {fields.map((field, index) => (
                  <Flex key={field.key} gap={8} align="flex-start">
                    <Form.Item
                      name={[field.name, 'studentId']}
                      rules={[{ required: true, message: t.common.requiredField }]}
                      style={{ flex: 2, marginBottom: 8 }}
                    >
                      <StudentSelect classId={classId} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'points']}
                      rules={[{ required: true, message: t.common.requiredField }, pointsRule]}
                      style={{ width: 100, marginBottom: 8 }}
                    >
                      <InputNumber
                        min={canRevoke ? -100 : 1}
                        max={100}
                        precision={0}
                        placeholder={t.common.points}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'note']}
                      rules={[{ required: true, message: t.common.requiredField }]}
                      style={{ flex: 2, marginBottom: 8 }}
                    >
                      <Input maxLength={200} placeholder={t.classes.bonusNote} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'gameId']} style={{ flex: 1, marginBottom: 8 }}>
                      <GameSelect style={{ width: '100%' }} />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    />
                  </Flex>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                  disabled={fields.length >= 100}
                >
                  {t.classes.bonusAddRow}
                </Button>
              </Flex>
            )}
          </Form.List>
        )}
      </Form>
      <Flex justify="flex-end" gap={8}>
        <Button onClick={onClose}>{t.common.cancel}</Button>
        <Button type="primary" loading={saving} onClick={() => form.submit()}>
          {t.common.save}
        </Button>
      </Flex>
    </Flex>
  );
}
