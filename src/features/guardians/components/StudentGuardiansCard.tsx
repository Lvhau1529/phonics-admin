import { EditOutlined } from '@ant-design/icons';
import { Button, Card, Flex, List, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { GuardianAccountTag } from '@/features/guardians/components/GuardianAccountTag';
import { StudentGuardiansModal } from '@/features/guardians/components/StudentGuardiansModal';
import type { StudentGuardianModel } from '@/features/guardians/models/GuardianModel';
import { t } from '@/shared/i18n';

interface StudentGuardiansCardProps {
  studentId: string;
  guardians: StudentGuardianModel[];
}

/** Thẻ Phụ huynh ở trang chi tiết học sinh; chỉ admin sửa được liên kết */
export function StudentGuardiansCard({ studentId, guardians }: StudentGuardiansCardProps) {
  const auth = useAuth();
  const [editing, setEditing] = useState(false);
  const canManage = auth.isAdmin;

  return (
    <Card
      size="small"
      title={t.students.guardians}
      style={{ marginBottom: 16 }}
      extra={
        canManage && (
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(true)}>
            {t.students.editGuardians}
          </Button>
        )
      }
    >
      <List<StudentGuardianModel>
        dataSource={guardians}
        locale={{ emptyText: t.students.noGuardians }}
        renderItem={(link) => (
          <List.Item>
            <Flex vertical gap={4} style={{ width: '100%' }}>
              <Space wrap>
                <Typography.Text strong>{link.guardian.fullName}</Typography.Text>
                <Tag>{t.guardianRelation[link.relation]}</Tag>
                {link.flagLabels.map((label) => (
                  <Tag key={label} color="blue">
                    {label}
                  </Tag>
                ))}
                <GuardianAccountTag guardian={link.guardian} />
              </Space>
              <Typography.Text type="secondary">
                {[link.guardian.email, link.guardian.phone].filter(Boolean).join(' · ') || t.common.none}
              </Typography.Text>
            </Flex>
          </List.Item>
        )}
      />
      {editing && (
        <StudentGuardiansModal studentId={studentId} current={guardians} onClose={() => setEditing(false)} />
      )}
    </Card>
  );
}
