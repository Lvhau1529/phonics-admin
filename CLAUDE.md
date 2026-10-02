# Quy tắc cho Claude — phonics-admin

Đọc [README.md](README.md) (cấu trúc, chạy, env). Stack: React 19 + Vite 8 + TS 7 + Ant Design 5 + TanStack Query 5 +
React Router 7 + Recharts (ADR 0008 trong phonics-dev). API: repo phonics-api.

## Git

- **Không tự `git push`.** Chỉ push khi người dùng yêu cầu rõ ràng. Làm xong thì commit (nếu phù hợp) và báo lại.
- Trước mỗi lần push: `pnpm build` (gồm typecheck) phải qua; đóng server dev / preview mình đã mở.
- Commit message **không** có dòng ghi công Claude. Subject tiếng Anh, body có thể tiếng Việt.
- Dùng **pnpm**; thêm / đổi package thì commit kèm `pnpm-lock.yaml` (deploy cài bằng `--frozen-lockfile`).
- Secret chỉ trong `.env` (gitignored); mẫu ở `.env.example`. Không ghi secret vào docs / commit / log.
- Giao diện song ngữ EN / VI: mọi chuỗi phải có trong cả `src/shared/i18n/vi.ts` và `en.ts` (ADR 0014).
- Validate hai lớp: validate bằng chính schema contracts trước khi gửi; API validate lại.

## Dev cùng các repo khác

Repo này độc lập (clone, cài, build, deploy riêng). Muốn chạy cả hệ thống cùng lúc (API + game + admin): đặt 3 repo
nằm cạnh nhau cùng repo **phonics-dev** rồi `pnpm dev` trong phonics-dev (README ở đó). Khi chạy qua phonics-dev, game /
admin đọc `@phonics/contracts` thẳng từ mã nguồn `../phonics-api/packages/contracts` (biến `PHONICS_CONTRACTS_SRC`,
xem `vite.config.ts` của game / admin) — sửa contracts thấy ngay, không cần phát hành.

## Kiến trúc

- **Feature folder**: `src/features/<feature>/{api/,models/,hooks.ts,pages/,components/}`. Code dùng chung ở
  `src/shared`. `shared` không import `features`; `features` import nhau được (vd `ClassSelect` của classes,
  `PointEntryModel` của points).
- **Alias `@/`** → `src`. Không dùng `../`. Import kiểu: `import { type X }` (inline).
- **Không CSS mới** (không SCSS module / Tailwind): dùng token antd, prop `style` nhỏ, component `Flex`/`Space`.
- **Chuỗi UI chỉ ở `src/shared/i18n/`**: thêm vào **cả `vi.ts` và `en.ts`** (en `satisfies Dict` → thiếu khoá là
  lỗi typecheck; test so tập khoá). Dùng `import { t } from '@/shared/i18n'` (Proxy theo ngôn ngữ hiện tại) —
  **không** import thẳng `i18n/vi`, **không** cache `t.xxx` ở cấp module (cột bảng → `buildColumns()` trong
  component). Không hard-code tiếng Việt / tiếng Anh trong component (trừ tên thương hiệu). Mã lỗi API →
  `t.errors[code]`; ngày / số → `utils/format.ts` (đọc `t.format.*`). Identifier tiếng Anh, comment tiếng Việt.

## Theme & loading

- Theme: `shared/theme/theme.ts` → `buildTheme(mode)`. Giữ kiểu dáng antd, chỉ đổi màu trong `THEME_COLORS[mode]`:
  điểm nhấn vàng `#ffdc58` + nền / viền xám trung tính zinc (kiểu shadcn / Vercel). Chỉ hai chế độ sáng / tối, **mặc
  định tối** (`themeStore`: `useThemeMode` / `setThemeMode`, nút `ThemeSwitch`). Chữ trên nền primary là mực
  (`colorTextLightSolid`), link light mode là nâu vàng đậm — đổi màu thì chạy `theme.test.ts` (tương phản ≥ 4.5).
  Component cần màu: `theme.useToken()` hoặc `THEME_COLORS[useThemeMode()]`, **không** hard-code hex; biểu đồ Recharts
  dùng `useChartTheme()`.
- Header: góc phải là `LangSwitch` (dropdown tên ngôn ngữ) + `ThemeSwitch` + user menu; trang đăng nhập đặt hai nút
  này ở góc trên phải. Nội dung `AppShell` trải hết bề ngang (không `maxWidth`).
- Loading (`shared/ui/Loading.tsx`, không Lottie): lần tải đầu là **skeleton** — `PageSkeleton` (Suspense trang lazy),
  `DataTable` / `DataTable.Static` tự hiện hàng skeleton khi chưa có dữ liệu, `ChartFrame` → `BlockSkeleton`;
  tải lại / khôi phục phiên là spinner `Spin` mặc định (`FullscreenLoader` cho HydrateFallback / RequireAuth). Bảng
  truyền `loading={query.isFetching}`, biểu đồ bọc `ChartFrame` — đã qua `useDelayedLoading` (200 ms / 400 ms) và giữ
  dữ liệu cũ (`keepPreviousData`); không tự `Spin` / `isLoading` để tránh nháy, không unmount bảng / chart khi refetch.

## API & dữ liệu (repository → service → model)

- **Repository** `features/<x>/api/<x>Repository.ts`: chỉ khai báo endpoint —
  `request(ENDPOINTS..., { method, body, query, schema })` trong `shared/api/client.ts`, **luôn truyền `schema`**
  (zod contracts), trả DTO đúng như BE. Không map / format / logic. Không `fetch` trực tiếp trong feature.
- **Service** `features/<x>/api/<x>Service.ts`: gọi repository rồi đổi DTO → model (`new XModel(dto)`, trang phân
  trang dùng `mapPage(page, fn)` ở `shared/api/pagination.ts`). Số liệu thống kê / biểu đồ, catalog tĩnh, response
  xác nhận của mutation thì trả thẳng DTO (ghi chú ngắn). Hook / store / component **chỉ gọi service** (query /
  mutation qua `hooks.ts`), không gọi repository.
- **Model** `features/<x>/models/<Name>Model.ts`: class, `constructor(data: Dto)` gán từng field `readonly` **cùng
  tên với DTO** (bảng sort server / `dataIndex` / form vẫn dùng tên field), thêm **getter** cho dữ liệu chỉ FE dùng
  (nhãn, text đã format theo `t`, cờ boolean...) — vd `ClassModel.label`, `StudentModel.lastLoginText`,
  `PointEntryModel.pointsText`. Format / nhãn lặp lại ở nhiều component → đưa vào getter, không viết lại trong
  `render`. Model cần lưu localStorage có `toJSON(): Dto` (đọc lại: parse schema → `new XModel`, xem
  `UserModel` + `authStore`). **Không spread model** (`{ ...model }` mất getter) — tạo instance mới. Test getter
  bằng `models/*.test.ts`.
- Token: access token trong bộ nhớ client, refresh token trong localStorage (`phonics-admin:auth`), 401 → refresh
  single-flight → gọi lại một lần → nếu vẫn lỗi → `signedOut`. Không tự xử lý 401 ở feature.
- TanStack Query: khoá cache **chỉ** từ `shared/api/queryKeys.ts` (`qk.classes.list(params)`); mutation
  `onSuccess` invalidate theo prefix (`qk.classes.all`). Mặc định `staleTime 30s`, `placeholderData: keepPreviousData`.
- Bảng phân trang server: `useTableQuery({ filterKeys, defaultSort })` (đồng bộ URL) + `DataTable` (`rowKey='id'`,
  cột sort server đặt `key` = field + `sorter: true`). Khoảng thời gian: `RangePicker` + `rangeParams(value)`.

## Form (validate hai lớp)

- antd `Form` + rule `zodRule(schemaField)` cho từng ô; trước khi gọi API luôn `parseForm(BodySchema, values)`
  (gate bằng schema contracts, lỗi → `applyFieldErrors`). API trả 400 `details` → `applyServerErrors(form, error)`.
- PATCH partial: `diffValues(original, next)` rồi parse (schema có refine "cần ít nhất một trường").
- Chuỗi rỗng từ Input → `stripEmpty(values)` để thành `undefined` (schema `.optional()` không nhận `''`).

## Role & quyền

- Route gate: `app/router.tsx` (`adminOnly([...])` bọc `RequireRole roles={['ADMIN']}`); menu: `app/layout/menu.ts`
  (`roles`). Không gate bằng cách ẩn link rồi thôi — phải có cả hai.
- Nút cần quyền: `useAuth().can('points.award')` → ẩn hoặc `disabled` + `Tooltip` giải thích. ADMIN luôn pass.
  Danh sách quyền: `PERMISSIONS` trong contracts (trang Phân quyền tự hiện quyền mới) — thêm quyền thì thêm nhãn
  `permissionLabel` + `permissionDescription` ở cả hai từ điển.
- Nhóm quyền (`features/permissions`): `permissionsService.groups / createGroup / updateGroup / deleteGroup /
  setUserGroups` (→ `PermissionGroupModel`, `UserPermissionsModel` có `sourceOf` / `overrideOf` / `has`), khoá
  `qk.permissions.groups` / `qk.permissions.users`; mutation nhóm invalidate cả ma trận user.
  Form chọn nhóm dùng `PermissionGroupSelect`; checklist quyền theo khu vực dùng `PermissionChecklist`.
- Giáo viên chỉ thấy lớp mình: server lọc; client không lọc thêm.

## Thêm trang / endpoint (checklist)

1. Contracts có schema + `ENDPOINTS`? Chưa có → thêm ở phonics-api (`packages/contracts`), phát hành bản mới (hoặc
   làm trong phonics-dev), `pnpm up @phonics/contracts`, rồi mới dùng.
2. `features/<x>/api/<x>Repository.ts` (endpoint + schema) → `models/<Name>Model.ts` (getter FE) →
   `api/<x>Service.ts` (DTO → model) → `features/<x>/hooks.ts` (+ khoá ở `queryKeys.ts`).
3. `pages/XPage.tsx` export **default** (lazy route) + named; đăng ký `app/router.tsx`, `app/routes.ts`, menu.
4. Chuỗi → `i18n/vi.ts` **và** `i18n/en.ts`. Quyền → `can()`. Test hook / util / getter của model nếu có logic
   (Vitest + jsdom, file `*.test.ts(x)`).
5. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` xanh, rồi commit.

## Không làm

- Không thêm thư viện i18n / state manager / CSS framework. Không dùng `any`. Không hiện message thô của server.
- Không start / stop dev server của phiên chat khác; không `git push` khi người dùng chưa yêu cầu.
