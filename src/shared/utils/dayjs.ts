/**
 * dayjs dùng chung cho cả app: nạp plugin + locale MỘT lần ở đây. Mọi file import từ `@/shared/utils/dayjs`
 * (ESLint chặn import thẳng `dayjs` / `dayjs/*` ở nơi khác) để plugin luôn có sẵn.
 */
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export type { ConfigType, Dayjs } from 'dayjs';
export { dayjs };
