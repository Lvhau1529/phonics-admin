import { ClockCircleOutlined, EnvironmentOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Flex, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import type { ExtraSlotModel } from '@/features/extra-slots/models/ExtraSlotModel';
import { t } from '@/shared/i18n';

/** Thẻ một ca trong lưới tuần */
export function SlotCard({ slot }: { slot: ExtraSlotModel }) {
  return (
    <Link to={ROUTES.extraSlotDetail(slot.id)}>
      <Card size="small" hoverable style={{ opacity: slot.isArchived ? 0.6 : 1 }}>
        <Flex vertical gap={4}>
          <Typography.Text strong>
            <ClockCircleOutlined /> {slot.timeRange}
          </Typography.Text>
          <Typography.Text ellipsis={{ tooltip: slot.name }}>{slot.name}</Typography.Text>
          {slot.room && (
            <Typography.Text type="secondary">
              <EnvironmentOutlined /> {slot.room}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" ellipsis={{ tooltip: slot.teacherNames }}>
            <UserOutlined /> {slot.teacherNames}
          </Typography.Text>
          <Flex gap={4} wrap>
            <Tag color={slot.isFull ? 'warning' : undefined} icon={<TeamOutlined />}>
              {slot.studentCountText}
            </Tag>
            {slot.defaultPriceText && <Tag>{slot.defaultPriceText}</Tag>}
            {slot.isArchived && <Tag>{t.extraSlots.archived}</Tag>}
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
}
