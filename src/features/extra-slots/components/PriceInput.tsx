import { Button, InputNumber, Tag, Tooltip } from 'antd';
import { t } from '@/shared/i18n';
import { formatPriceInput, parsePriceInput } from '@/shared/utils/format';

interface PriceInputProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
}

/** Ô nhập đơn giá / buổi (VND) dùng trong Form.Item: nút "Miễn phí" điền 0; giá 0 hiện thẻ "Miễn phí" */
export function PriceInput({ value, onChange, placeholder }: PriceInputProps) {
  return (
    <InputNumber<number>
      value={value}
      onChange={(v) => onChange?.(v)}
      min={0}
      step={10_000}
      placeholder={placeholder}
      style={{ width: '100%' }}
      suffix={t.format.currency}
      formatter={formatPriceInput}
      parser={parsePriceInput}
      addonAfter={
        value === 0 ? (
          <Tag color="green" style={{ margin: 0 }}>
            {t.extraSlots.free}
          </Tag>
        ) : (
          <Tooltip title={t.extraSlots.freeHint}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => onChange?.(0)}
            >
              {t.extraSlots.free}
            </Button>
          </Tooltip>
        )
      }
    />
  );
}
