import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Providers } from '@/app/providers';
import { t } from '@/shared/i18n';
import { TypedConfirmModal } from '@/shared/ui/TypedConfirmModal';

describe('TypedConfirmModal', () => {
  it('nút xác nhận chỉ bấm được sau khi gõ đúng cụm (không dấu cũng được)', () => {
    const onOk = vi.fn();
    render(
      <Providers bootstrap={false}>
        <TypedConfirmModal
          open
          title="Xoá"
          warning="Cảnh báo"
          phrase="XÓA"
          okText="OK-BTN"
          onOk={onOk}
          onCancel={() => undefined}
        />
      </Providers>,
    );
    const ok = screen.getByRole('button', { name: 'OK-BTN' });
    const input = screen.getByLabelText(t.common.typeToConfirm('XÓA'));

    fireEvent.change(input, { target: { value: 'xo' } });
    expect(ok).toBeDisabled();

    fireEvent.change(input, { target: { value: 'xoa' } });
    expect(ok).toBeEnabled();
    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(1);
  });
});
