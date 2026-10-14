import { SoundOutlined } from '@ant-design/icons';
import { Image, Tag, Typography, theme } from 'antd';
import type { ReactNode } from 'react';
import { useMediaMap } from '@/features/media/mediaMap';
import { usePartStyle } from '@/features/questions/renderers/usePartStyle';
import { AudioPlayer } from '@/features/media/components/AudioPlayer';
import { t } from '@/shared/i18n';

export type RendererMode = 'preview' | 'try' | 'review';

/** Props chung của mọi renderer: config (bắt buộc), answerKey (GV / review), answer (try / review), parts (phần đúng) */
export interface RendererProps<C, K, A> {
  config: C;
  answerKey?: K | null;
  answer?: A | null;
  mode: RendererMode;
  onChange?: (answer: A) => void;
  /** Kết quả chấm theo phần (checkAnswer.parts / gradeDetail) để tô màu khi review */
  parts?: Record<string, boolean>;
}

/** Ảnh theo mediaId (tra MediaMapContext); không có → ô xám */
export function MediaImage({
  id,
  size = 96,
  style,
}: {
  id: string | null | undefined;
  size?: number;
  style?: React.CSSProperties;
}) {
  const { token } = theme.useToken();
  const ref = useMediaMap().get(id);
  if (!id) return null;
  if (!ref)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: token.borderRadius,
          background: token.colorFillQuaternary,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  return (
    <Image
      src={ref.url}
      width={size}
      height={size}
      preview={false}
      style={{
        objectFit: 'contain',
        borderRadius: token.borderRadius,
        background: token.colorFillQuaternary,
        ...style,
      }}
    />
  );
}

export function MediaAudio({ id, speed }: { id: string | null | undefined; speed?: boolean }) {
  const ref = useMediaMap().get(id);
  if (!id) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <SoundOutlined />
      <AudioPlayer src={ref?.url} speed={speed} />
    </span>
  );
}

/** Khung ô chọn (ảnh / chữ) có thể bấm */
export function Tile({
  children,
  selected,
  ok,
  onClick,
  disabled,
  style,
  badge,
}: {
  children: ReactNode;
  selected?: boolean;
  ok?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  badge?: ReactNode;
}) {
  const { token } = theme.useToken();
  const partStyle = usePartStyle();
  const clickable = !!onClick && !disabled;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 6,
        border: `2px solid ${token.colorBorder}`,
        borderRadius: token.borderRadiusLG,
        cursor: clickable ? 'pointer' : 'default',
        minWidth: 44,
        minHeight: 44,
        userSelect: 'none',
        ...partStyle(ok, selected),
        ...style,
      }}
    >
      {children}
      {badge !== undefined && badge !== null && (
        <span
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 10,
            background: token.colorPrimary,
            color: token.colorTextLightSolid,
            fontSize: 12,
            lineHeight: '20px',
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/** Chữ cái / từ kiểu "chữ cho bé" (chữ to, đậm) */
export function Letter({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <Typography.Text
      strong
      style={{ fontSize: 20, fontFamily: 'Andika, "Comic Sans MS", sans-serif', ...style }}
    >
      {children}
    </Typography.Text>
  );
}

/** Nhãn "Đáp án đúng: …" trong review */
export function Expected({ children }: { children: ReactNode }) {
  return (
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {t.grading.expected}: <Tag color="green">{children}</Tag>
    </Typography.Text>
  );
}

/** Ô nhập chữ ngắn (1–3 ký tự hoặc một từ) dùng trong try / review */
export function LetterInput({
  value,
  onChange,
  disabled,
  ok,
  width = 44,
  maxLength = 3,
  placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  ok?: boolean;
  width?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  const { token } = theme.useToken();
  const partStyle = usePartStyle();
  return (
    <input
      value={value}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label={placeholder ?? 'letter'}
      style={{
        width,
        height: 40,
        textAlign: 'center',
        fontSize: 20,
        fontFamily: 'Andika, "Comic Sans MS", sans-serif',
        border: `2px solid ${token.colorBorder}`,
        borderRadius: token.borderRadius,
        background: token.colorBgContainer,
        color: token.colorText,
        outline: 'none',
        ...partStyle(ok),
      }}
    />
  );
}
