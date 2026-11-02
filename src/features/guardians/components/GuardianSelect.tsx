import { Select, type SelectProps } from 'antd';
import { useState } from 'react';
import { GuardiansService } from '@/features/guardians/api/guardiansService';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';

type GuardianSelectProps = Omit<
  SelectProps<string>,
  'options' | 'loading' | 'showSearch' | 'onSearch' | 'filterOption'
> & {
  /** Nhãn phụ huynh đang chọn (khi không nằm trong kết quả tìm hiện tại) */
  currentLabel?: string;
};

/** Chọn một phụ huynh, tìm phía server theo tên / email / SĐT */
export function GuardianSelect({ currentLabel, value, ...props }: GuardianSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const { data, isFetching } = GuardiansService.useOptions(q);
  const options = (data ?? []).map((g) => ({ value: g.id, label: g.label }));
  if (value && currentLabel && !options.some((o) => o.value === value))
    options.unshift({ value, label: currentLabel });

  return (
    <Select<string>
      showSearch
      filterOption={false}
      placeholder={t.guardians.searchGuardians}
      style={{ width: '100%' }}
      {...props}
      value={value}
      onSearch={setSearch}
      loading={isFetching}
      options={options}
    />
  );
}
