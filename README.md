# phonics-admin — Web Admin Phonics Arcade

Trang quản trị cho **admin** và **giáo viên**: tổng quan, lớp học, học sinh, sổ điểm, cộng điểm thưởng, mở khoá
game, phân quyền (nhóm quyền + ma trận theo giáo viên), nhật ký, báo cáo xlsx / pdf. Giao diện **tiếng Việt /
tiếng Anh** (chuyển ở header), theme **vàng trùng game** có **dark mode**.

Stack (ADR 0008 trong phonics-dev): React 19 + Vite 8 + TypeScript 7 + Ant Design 5 +
TanStack Query 5 + React Router 7 + Recharts + dayjs + zod (schema dùng chung từ `@phonics/contracts`).

## Chạy

```bash
pnpm install      # cần token GitHub Packages cho @phonics/contracts (xem mục Gói @phonics/contracts)
pnpm dev          # vite --port 5174 — cần API (repo phonics-api) chạy ở VITE_API_URL
pnpm build        # typecheck + vite build → dist/
pnpm preview      # xem bản build (port 4174)
pnpm typecheck    # tsc (src) + tsc (vite.config)
pnpm lint         # eslint
pnpm test         # vitest (jsdom + Testing Library)
```

Tài khoản demo (API seed với `SEED_DEMO=true`): admin `admin@phonics.local` (mật khẩu trong `.env` của
phonics-api, `ADMIN_PASSWORD`), giáo viên `teacher1@demo.local` / `Demo1234!`. Học sinh **không** đăng nhập được admin.

## Env

Sao chép `.env.example` → `.env`:

| Biến            | Mặc định                | Ý nghĩa                                                               |
| --------------- | ----------------------- | --------------------------------------------------------------------- |
| `VITE_API_URL`  | `http://localhost:3000` | Gốc API (admin gọi `${VITE_API_URL}/api/v1/...`)                         |
| `VITE_GAME_URL` | `http://localhost:5173` | Gốc app game — ảnh avatar preset lấy từ `${VITE_GAME_URL}/assets/...` |

API phải cho phép origin của admin trong `CORS_ORIGINS` và expose header `Content-Disposition` (đã có sẵn).

## Cấu trúc

```text
src/
├── main.tsx                 Mount: Providers + RouterProvider
├── app/
│   ├── providers.tsx        ConfigProvider (locale + theme theo langStore / themeStore, key={lang}) + antd App
│   │                        + QueryClient + khôi phục phiên
│   ├── router.tsx           createBrowserRouter; trang tải lười; HydrateFallback FullscreenLoader; RequireAuth → AppShell
│   ├── routes.ts            Hằng số đường dẫn (ROUTES.classDetail(id)...)
│   ├── layout/              AppShell (sider + header góc phải: LangSwitch, ThemeSwitch; Suspense PageSkeleton), menu.ts (labelKey + role)
│   └── guards/              RequireAuth (chưa đăng nhập → /login), RequireRole (sai role → 403)
├── features/<feature>/
│   ├── api/
│   │   ├── <x>Repository.ts Khai báo endpoint: request(ENDPOINTS..., { schema }) → DTO đúng như BE
│   │   └── <x>Service.ts    Gọi repository, đổi DTO → model (mapPage cho trang phân trang)
│   ├── models/              <Name>Model.ts — class nhận DTO, field cùng tên + getter dữ liệu chỉ FE dùng
│   ├── hooks.ts             useQuery / useMutation (gọi service) + invalidate
│   ├── pages/               Trang (export default cho lazy route)
│   └── components/          Drawer / Modal / Tab / bảng riêng của feature
└── shared/
    ├── api/client.ts        fetch + bearer + refresh single-flight + parse zod; downloadFile
    ├── api/errors.ts        ApiError, errorMessage (mã lỗi → tiếng Việt)
    ├── api/queryKeys.ts     qk.* — khoá cache TanStack Query
    ├── api/pagination.ts    mapPage(page, fn) — đổi item của trang DTO → model
    ├── hooks/               useTableQuery (bảng ↔ URL), useDebouncedValue, useDelayedLoading (chống nháy),
    │                        useChartTheme (màu Recharts từ token antd)
    ├── ui/                  PageHeader, DataTable (+ DataTable.Static), ChartFrame, Loading (FullscreenLoader / PageSkeleton / BlockSkeleton),
    │                        BrandMark, ThemeSwitch, LangSwitch, RangePicker, AvatarImg, RoleTag, ErrorAlert…
    ├── utils/               format (ngày, số theo ngôn ngữ), zodForm (antd ↔ zod), contrast (WCAG), download…
    ├── i18n/                vi.ts (từ điển nguồn), en.ts (`satisfies Dict`), langStore.ts, index.ts (`t` Proxy)
    ├── theme/theme.ts       buildTheme(mode) + THEME_COLORS (light / dark) + GAME_COLORS
    ├── theme/themeStore.ts  'light' | 'dark', mặc định dark (localStorage `phonics-admin:theme`, data-theme trên html)
    └── config.ts            VITE_API_URL, VITE_GAME_URL, khoá localStorage
```

## Theme (giữ kiểu antd, màu vàng + xám trung tính, mặc định tối)

`src/shared/theme/theme.ts` → `buildTheme(mode)` cho `ConfigProvider`. Kiểu dáng là antd mặc định (radius 8, viền
1px, bóng mềm); chỉ đổi màu: điểm nhấn vàng `#ffdc58` (tham khảo neobrutalism.com), nền / viền / chữ theo thang xám
zinc (kiểu shadcn/ui, Vercel, Linear) để dễ đọc ở cả hai chế độ.

| Token                                    | Light                   | Dark                    | Tương phản (WCAG)     |
| ---------------------------------------- | ----------------------- | ----------------------- | --------------------- |
| `colorPrimary` (nút primary)             | `#ffdc58`               | `#ffdc58`               |                       |
| `colorTextLightSolid` (chữ trên primary) | `#09090b`               | `#09090b`               | ≈ 15 : 1              |
| `colorLink` / `colorPrimaryText`         | `#854d0e`               | `#ffdc58`               | ≥ 6 : 1 / ≥ 12 : 1    |
| `colorBgLayout` / `colorBgContainer`     | `#f4f4f5` / `#ffffff`   | `#09090b` / `#18181b`   |                       |
| Sider / mục chọn                         | `#ffffff` / `#fef3c7`   | `#18181b` / `#3a3115`   | ≥ 7 : 1               |

Vàng trên nền trắng chỉ ~1.4 : 1 nên **chữ màu primary** (link, Tabs, Pagination, Button text) ở light mode dùng nâu
vàng `#854d0e`, còn nền primary giữ vàng với chữ mực. darkAlgorithm của antd tự làm xỉn primary → `buildTheme` thêm
một thuật toán cuối ghim lại `#ffdc58`. Checkbox / Radio: dấu tick màu mực. Test `src/shared/theme/theme.test.ts` đo
lại bằng `utils/contrast.ts`.

Chế độ: `shared/theme/themeStore.ts` (`useThemeMode` / `setThemeMode`; chỉ `light` | `dark`, **mặc định `dark`**),
nút `ThemeSwitch` ở góc phải header. Biểu đồ Recharts lấy màu qua `useChartTheme()` (token antd + palette
`THEME_COLORS[mode].chart`) nên tự đổi theo chế độ — **không hard-code màu** trong chart.

## i18n (VI / EN)

- `shared/i18n/vi.ts` là từ điển **nguồn**; `en.ts` phải có đúng cấu trúc (`satisfies Dict`, typecheck fail nếu
  thiếu khoá; test `i18n.test.ts` so tập khoá lúc chạy). **Mọi chuỗi mới thêm vào cả hai file.**
- `t` (từ `@/shared/i18n`) là Proxy đọc từ điển hiện tại lúc truy cập → dùng `t.common.save` như cũ. Không cache
  `t.xxx` ở cấp module (hằng ngoài component) — cột bảng / nhãn dựng trong component hoặc hàm `buildColumns()`.
- Ngôn ngữ: `langStore.ts` (localStorage `phonics-admin:lang`, mặc định theo `navigator.language`), `LangSwitch` ở
  header. `Providers` đặt `key={lang}` (remount cây React, cache TanStack Query giữ nguyên), `ConfigProvider locale`
  (viVN / enUS) và `dayjs.locale`. Định dạng ngày / số theo `t.format.*` (`utils/format.ts`).
- Mô tả quyền từ contracts là tiếng Việt → `t.permissionDescription[code]` (fallback mô tả contracts).

## Loading & chống nháy

- `shared/ui/Loading.tsx` (không Lottie): lần tải đầu hiện skeleton đúng hình nội dung — `PageSkeleton` (Suspense
  trang lazy), hàng skeleton trong `DataTable` / `DataTable.Static` khi chưa có dữ liệu, `BlockSkeleton` trong
  `ChartFrame`; `FullscreenLoader` (logo + `Spin`) cho `HydrateFallback` và màn khôi phục phiên (`RequireAuth`).
- `useDelayedLoading(isFetching, { delay: 200, minDuration: 400 })`: spinner chỉ hiện khi tải > 200 ms và giữ ≥
  400 ms. Bảng / biểu đồ truyền `isFetching` (không phải `isLoading`) — dữ liệu cũ vẫn hiển thị nhờ
  `placeholderData: keepPreviousData`, chỉ phủ spinner mờ, không unmount.

## Đăng nhập & phân quyền

- `POST /auth/login` (header `X-Refresh-Transport: body`) → access token giữ trong bộ nhớ (`shared/api/client`),
  `{ user, refreshToken }` lưu localStorage `phonics-admin:auth`. Khởi động: refresh → `GET /auth/me` (user +
  `permissions` hiệu lực). Mọi lời gọi 401 → refresh một lần (gộp các lời gọi đồng thời) → gọi lại; thất bại →
  đăng xuất.
- Role `STUDENT` bị từ chối ngay sau khi đăng nhập (thu hồi phiên vừa cấp).
- Menu lọc theo role (`app/layout/menu.ts`); route ADMIN bọc `RequireRole`. Nút cần quyền dùng
  `useAuth().can('games.unlock')` để ẩn / disable (ADMIN luôn có mọi quyền). Giáo viên chỉ thấy lớp mình — server
  lọc, client không cần làm gì thêm.
- Trang **Phân quyền** (`features/permissions`, ADMIN) có hai tab (`?tab=groups|users`):
  - **Nhóm quyền** (vai trò tuỳ biến): bảng `GET /admin/permission-groups` (tên, mô tả, quyền dạng Tag, số thành
    viên, nhãn Hệ thống); Drawer tạo / sửa (`POST` / `PATCH`) với checklist quyền gom theo khu vực `class.*`,
    `points.*`, `students.*`, `games.*`, `reports.*`, `stats.*`; xoá (`DELETE`, nhóm hệ thống bị disable).
  - **Theo giáo viên**: chọn GV → multi-select nhóm quyền (`PUT /admin/users/:id/permission-groups`) + ma trận
    Mặc định / Cấp / Thu hồi (`PUT /admin/users/:id/permissions`), cột **Nguồn** (mặc định role / nhóm / cấp riêng /
    thu hồi riêng) và **Hiệu lực**. Quyền hiệu lực = mặc định role ∪ nhóm ∪ GRANT − REVOKE (server tính).
  - Form giáo viên (`TeacherFormDrawer`) có ô nhóm quyền tuỳ chọn: tạo → `POST /admin/teachers` rồi `PUT` nhóm nếu
    có chọn; sửa → nạp nhóm hiện có từ `GET /admin/users/:id/permissions`, chỉ `PUT` khi đổi.

## Thêm trang mới

1. Contracts: schema / `ENDPOINTS` đã có? Chưa thì thêm ở phonics-api
   (`packages/contracts`), phát hành bản mới rồi `pnpm up @phonics/contracts` ở đây (hoặc làm trong phonics-dev).
2. `src/features/<feature>/api/<feature>Repository.ts`: khai báo endpoint `request(ENDPOINTS.x, { schema })` (trả
   DTO); `models/<Name>Model.ts`: class nhận DTO + getter dữ liệu chỉ FE dùng; `api/<feature>Service.ts`: gọi
   repository, đổi DTO → model.
3. `src/features/<feature>/hooks.ts`: `useQuery({ queryKey: qk.<feature>.list(params), queryFn: () => xService.list(params) })`; thêm khoá vào
   `shared/api/queryKeys.ts`; mutation `onSuccess` invalidate theo prefix.
4. Trang trong `pages/<Name>Page.tsx` (`export default`), đăng ký ở `app/router.tsx` (bọc `adminOnly` nếu cần),
   thêm đường dẫn vào `app/routes.ts`, mục menu vào `app/layout/menu.ts`.
5. Chuỗi hiển thị thêm vào **cả** `shared/i18n/vi.ts` và `en.ts`.
6. Bảng phân trang: `useTableQuery` + `DataTable`; form: antd `Form` + `zodRule(schema)` + `parseForm(Body, values)`
   trước khi gọi API, `applyServerErrors(form, error)` khi API trả 400.

## Gói `@phonics/contracts` (GitHub Packages)

Schema / type / hằng số dùng chung với API là gói `@lvhau1529/phonics-contracts` (phát hành từ repo phonics-api), cài qua alias
`"@phonics/contracts": "npm:@lvhau1529/phonics-contracts@^1"` nên code vẫn `import … from '@phonics/contracts'`.
GitHub Packages cần token kể cả khi chỉ đọc. Token **chỉ nằm trong biến môi trường `NODE_AUTH_TOKEN`** (GitHub PAT
classic, quyền `read:packages`). File `.npmrc.auth` (commit, không chứa secret) ghi
`//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}`; pnpm 12 bỏ qua `${...}` trong credential của `.npmrc` repo,
nên phải bật file này bằng biến `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth` (pnpm chỉ tin file auth do môi trường chỉ
định):

- Vercel: chỉ cần đặt `NODE_AUTH_TOKEN` (Production + Preview); `vercel.json > installCommand` đã kèm
  `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth`. Biến `NPM_RC` cũ không cần nữa (xoá đi).
- CI (GitHub Actions): đã đặt sẵn cả hai biến (`NODE_AUTH_TOKEN` = `GITHUB_TOKEN`); ở trang package
  `phonics-contracts` > Package settings > Manage Actions access, thêm repo này với quyền Read.
- Máy dev: đặt `NODE_AUTH_TOKEN` trong biến môi trường user. Cài qua phonics-dev (`pnpm repos install`) thì launcher
  tự bật `.npmrc.auth`; cài thẳng trong repo thì chạy `PNPM_CONFIG_NPMRC_AUTH_FILE=.npmrc.auth pnpm install`
  (PowerShell: `$env:PNPM_CONFIG_NPMRC_AUTH_FILE='.npmrc.auth'; pnpm install`), hoặc một lần thêm dòng
  `//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}` vào `~/.npmrc` (file user được mở rộng env) rồi
  `pnpm install` như thường.

Nâng version: `pnpm up @phonics/contracts` rồi commit lockfile. Sửa contracts và thấy ngay ở app (không cần phát hành):
chạy qua launcher phonics-dev (`pnpm dev`).

## Deploy

Vercel, _Root Directory_ = gốc repo (`vercel.json`: build bằng `pnpm run build`, rewrite SPA về `index.html`).
Đặt `NODE_AUTH_TOKEN` (token đọc GitHub Packages, xem trên — `installCommand` đã bật `.npmrc.auth`), `VITE_API_URL`,
`VITE_GAME_URL` trong project settings.
