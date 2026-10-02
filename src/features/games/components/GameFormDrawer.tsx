import { App, Button, Drawer, Flex, Form, Input, InputNumber, Switch } from 'antd';
import { UpdateGameBody } from '@phonics/contracts';
import { useEffect } from 'react';
import { useUpdateGame } from '@/features/games/hooks';
import type { GameAdminModel } from '@/features/games/models/GameAdminModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { applyFieldErrors, applyServerErrors, diffValues, parseForm } from '@/shared/utils/zodForm';

interface GameFormValues {
  title: string;
  enabled: boolean;
  comingSoon: boolean;
  price: number | null;
  sortOrder: number;
}

interface GameFormDrawerProps {
  game: GameAdminModel | undefined;
  onClose: () => void;
}

/** Sửa catalog game (quyền games.manage): tên, bật / tắt, sắp ra mắt, giá, thứ tự */
export function GameFormDrawer({ game, onClose }: GameFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<GameFormValues>();
  const update = useUpdateGame();

  useEffect(() => {
    if (!game) return;
    form.resetFields();
    form.setFieldsValue({
      title: game.title,
      enabled: game.enabled,
      comingSoon: game.comingSoon,
      price: game.price,
      sortOrder: game.sortOrder,
    });
  }, [game, form]);

  const handleFinish = async (raw: GameFormValues) => {
    if (!game) return;
    const next = { ...raw, title: raw.title.trim(), price: raw.price ?? null };
    const diff = diffValues(
      {
        title: game.title,
        enabled: game.enabled,
        comingSoon: game.comingSoon,
        price: game.price,
        sortOrder: game.sortOrder,
      },
      next,
    );
    if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
    const parsed = parseForm(UpdateGameBody, diff);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await update.mutateAsync({ id: game.id, body: parsed.data });
      message.success(t.common.updated);
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={!!game}
      onClose={onClose}
      title={game ? `${t.games.edit}: ${t.gameName[game.id]}` : t.games.edit}
      width={400}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      <Form<GameFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label={t.games.gameTitle}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="enabled" label={t.games.enabled} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="comingSoon" label={t.games.comingSoon} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="price" label={t.games.price} extra={t.games.priceHint}>
          <InputNumber min={0} max={100000} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="sortOrder"
          label={t.games.sortOrder}
          rules={[{ required: true, message: t.common.requiredField }]}
        >
          <InputNumber min={0} max={1000} precision={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
