import { DeleteOutlined, PictureOutlined, SoundOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Flex, Image, Progress, Tooltip, Typography, Upload, theme } from 'antd';
import type { MediaKind } from '@phonics/contracts';
import { useState } from 'react';
import { useMediaMap } from '@/features/media/mediaMap';
import { AudioPlayer } from '@/features/media/components/AudioPlayer';
import { MediaService } from '@/features/media/api/mediaService';
import { acceptFor, maxMb, validateFile } from '@/features/media/utils/mediaLimits';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface MediaUploadProps {
  kind: MediaKind;
  /** mediaId (giá trị trong config câu hỏi) */
  value?: string | null;
  onChange?: (mediaId: string | undefined) => void;
  disabled?: boolean;
  /** Cạnh ô ảnh (px) */
  size?: number;
  /** Nhãn nút (mặc định theo loại) */
  label?: string;
}

/**
 * Ô tải ảnh / audio: chọn file → presign → PUT → complete → `onChange(mediaId)`. URL preview lấy từ MediaMapContext
 * (file vừa upload được `add` vào map). Dùng được như control của antd Form (value / onChange).
 */
export function MediaUpload({ kind, value, onChange, disabled, size = 96, label }: MediaUploadProps) {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const mediaMap = useMediaMap();
  const upload = MediaService.useUpload();
  const [percent, setPercent] = useState<number | null>(null);
  const ref = mediaMap.get(value);

  const handleFile = async (file: File) => {
    const check = validateFile(file, kind);
    if (!check.ok) {
      message.error(check.reason === 'type' ? t.media.badType : t.media.tooLarge(maxMb(kind)));
      return;
    }
    setPercent(0);
    try {
      const result = await upload.mutateAsync({
        file,
        kind,
        options: { onProgress: (p) => setPercent(p.percent) },
      });
      mediaMap.add(result);
      onChange?.(result.id);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setPercent(null);
    }
  };

  const uploadButton = (
    <Upload
      accept={acceptFor(kind)}
      showUploadList={false}
      disabled={disabled || percent !== null}
      beforeUpload={(file) => {
        void handleFile(file);
        return Upload.LIST_IGNORE;
      }}
    >
      <Button icon={<UploadOutlined />} disabled={disabled} loading={percent !== null} size="small">
        {label ?? (kind === 'IMAGE' ? t.media.uploadImage : t.media.uploadAudio)}
      </Button>
    </Upload>
  );

  if (percent !== null) {
    return (
      <Flex vertical gap={4} style={{ width: size }}>
        <Progress percent={percent} size="small" />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.media.uploading}
        </Typography.Text>
      </Flex>
    );
  }

  if (kind === 'IMAGE') {
    return (
      <Flex vertical gap={4} align="flex-start">
        {ref ? (
          <div style={{ position: 'relative', width: size, height: size }}>
            <Image
              src={ref.url}
              width={size}
              height={size}
              style={{
                objectFit: 'contain',
                borderRadius: token.borderRadius,
                background: token.colorFillQuaternary,
              }}
            />
            {!disabled && (
              <Tooltip title={t.media.remove}>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onChange?.(undefined)}
                  style={{ position: 'absolute', top: 2, right: 2 }}
                />
              </Tooltip>
            )}
          </div>
        ) : value ? (
          // Có id nhưng chưa có URL (map chưa nạp) — hiện ô trống
          <div
            style={{
              width: size,
              height: size,
              borderRadius: token.borderRadius,
              background: token.colorFillQuaternary,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <PictureOutlined />
          </div>
        ) : null}
        {!disabled && (!ref || !value) && uploadButton}
        {!disabled && ref && (
          <Upload
            accept={acceptFor(kind)}
            showUploadList={false}
            beforeUpload={(file) => {
              void handleFile(file);
              return Upload.LIST_IGNORE;
            }}
          >
            <Button type="link" size="small">
              {t.media.replace}
            </Button>
          </Upload>
        )}
      </Flex>
    );
  }

  return (
    <Flex align="center" gap={8} wrap>
      {ref ? (
        <>
          <SoundOutlined />
          <AudioPlayer src={ref.url} />
          {!disabled && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange?.(undefined)}>
              {t.media.remove}
            </Button>
          )}
        </>
      ) : (
        uploadButton
      )}
    </Flex>
  );
}
