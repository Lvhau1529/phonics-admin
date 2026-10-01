import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { t } from '@/shared/i18n';

interface PageHeaderProps {
  title: ReactNode;
  /** Tiêu đề tab trình duyệt (mặc định = title nếu là chuỗi) */
  documentTitle?: string;
  subtitle?: ReactNode;
  /** Nút / control bên phải */
  extra?: ReactNode;
  /** Có nút quay lại (đường dẫn hoặc -1 = lịch sử) */
  backTo?: string | -1;
  children?: ReactNode;
}

/** Tiêu đề trang thống nhất: tên + mô tả + nút thao tác; đặt document.title */
export function PageHeader({ title, documentTitle, subtitle, extra, backTo, children }: PageHeaderProps) {
  const navigate = useNavigate();
  const docTitle = documentTitle ?? (typeof title === 'string' ? title : undefined);

  useEffect(() => {
    if (docTitle) document.title = t.app.title(docTitle);
  }, [docTitle]);

  return (
    <Flex vertical gap={12} style={{ marginBottom: 16 }}>
      <Flex align="flex-start" justify="space-between" gap={16} wrap>
        <Flex align="center" gap={8}>
          {backTo !== undefined && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              aria-label={t.common.back}
              onClick={() => (backTo === -1 ? navigate(-1) : navigate(backTo))}
            />
          )}
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
          </div>
        </Flex>
        {extra && (
          <Flex gap={8} wrap>
            {extra}
          </Flex>
        )}
      </Flex>
      {children}
    </Flex>
  );
}
