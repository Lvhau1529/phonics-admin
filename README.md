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
│   │                        + QueryClient + khôi phục phiên; Spin.setDefaultIndicator(LottieLoader)
│   ├── router.tsx           createBrowserRouter; trang tải lười; HydrateFallback Lottie; RequireAuth → AppShell
│   ├── routes.ts            Hằng số đường dẫn (ROUTES.classDetail(id)...)
│   ├── layout/              AppShell (sider + header: ThemeSwitch, LangSwitch, Suspense), menu.ts (labelKey + role)
│   └── guards/              RequireAuth (chưa đăng nhập → /login), RequireRole (sai role → 403)
├── features/<feature>/
│   ├── api.ts               Hàm gọi endpoint (request + schema contracts)
│   ├── hooks.ts             useQuery / useMutation + invalidate
│   ├── pages/               Trang (export default cho lazy route)
│   └── components/          Drawer / Modal / Tab / bảng riêng của feature
└── shared/
    ├── api/client.ts        fetch + bearer + refresh single-flight + parse zod; downloadFile
    ├── api/errors.ts        ApiError, errorMessage (mã lỗi → tiếng Việt)
    ├── api/queryKeys.ts     qk.* — khoá cache TanStack Query
    ├── hooks/               useTableQuery (bảng ↔ URL), useDebouncedValue, useDelayedLoading (chống nháy),
    │                        useChartTheme (màu Recharts từ token antd)
    ├── ui/                  PageHeader, DataTable (+ DataTable.Static), ChartFrame, LottieLoader / CenteredLoader,
    │                        ThemeSwitch, LangSwitch, RangePicker, GameSelect, AvatarImg, RoleTag, ErrorAlert…
    ├── utils/               format (ngày, số theo ngôn ngữ), zodForm (antd ↔ zod), contrast (WCAG), download…
    ├── i18n/                vi.ts (từ điển nguồn), en.ts (`satisfies Dict`), langStore.ts, index.ts (`t` Proxy)
    ├── theme.ts             buildTheme(mode) + THEME_COLORS (light / dark) + GAME_COLORS
    ├── theme/themeStore.ts  'light' | 'dark' | 'system' (localStorage `phonics-admin:theme`, data-theme trên html)
    └── config.ts            VITE_API_URL, VITE_GAME_URL, khoá localStorage
```

## Theme (vàng trùng game + dark mode)

`src/shared/theme.ts` → `buildTheme(mode)` cho `ConfigProvider`; màu lấy từ palette game
(phonics-game `src/platform/styles/tailwind.css`: gold `#ffd23f`, honey `#ffc83d`, ink `#2e1608`, paper `#fffaf0`…).

| Token                                    | Light                       | Dark                  | Tương phản (WCAG)          |
| ---------------------------------------- | --------------------------- | --------------------- | -------------------------- |
| `colorPrimary` (nút, focus)              | `#E0A100`                   | `#ffc83d`             |                            |
| `colorTextLightSolid` (chữ trên primary) | `#2e1608`                   | `#2e1608`             | 7.5 : 1 / 11.0 : 1         |
| `colorLink` / `colorPrimaryText`         | `#9A6B00`                   | `#ffd86a`             | 4.7 : 1 (trắng) / 12.4 : 1 |
| `colorBgLayout` / `colorBgContainer`     | `#fffaf0` / `#ffffff`       | `#1a1208` / `#241a0e` |                            |
| Sider / mục chọn                         | `#2e1608` / honey `#ffc83d` | `#120c05` / honey     | 13.8 : 1 / 11.0 : 1        |

Vàng tươi trên nền trắng chỉ ~2.3 : 1 nên **chữ màu primary** (link, Tabs, Pagination, Button text) dùng hổ phách
đậm `#9A6B00`, còn nền primary giữ vàng với chữ mực tối. Checkbox / Radio: dấu tick màu mực. Test
`src/shared/theme.test.ts` đo lại bằng `utils/contrast.ts` (phải ≥ 4.5 cho cả hai mode).

Chế độ: `shared/theme/themeStore.ts` (`useThemePreference` / `useResolvedTheme`, `'system'` theo
`prefers-color-scheme`), toggle `ThemeSwitch` ở header. Biểu đồ Recharts lấy màu qua `useChartTheme()` (token antd +
palette `THEME_COLORS[mode].chart`) nên tự đổi theo dark mode — **không hard-code màu** trong chart.

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

- `LottieLoader` (`public/lottie/loading.json`, player `lottie-web/build/player/lottie_light` nạp lazy; tôn trọng
  `prefers-reduced-motion` → icon tĩnh). Dùng: chỉ báo mặc định của `Spin`, `HydrateFallback`, màn khôi phục phiên
  (`RequireAuth`), `Suspense` trang lazy trong `AppShell`, `DataTable` / `DataTable.Static`, `ChartFrame`.
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
2. `src/features/<feature>/api.ts`: hàm gọi `request(ENDPOINTS.x, { schema })`.
3. `src/features/<feature>/hooks.ts`: `useQuery({ queryKey: qk.<feature>.list(params) })`; thêm khoá vào
   `shared/api/queryKeys.ts`; mutation `onSuccess` invalidate theo prefix.
4. Trang trong `pages/<Name>Page.tsx` (`export default`), đăng ký ở `app/router.tsx` (bọc `adminOnly` nếu cần),
   thêm đường dẫn vào `app/routes.ts`, mục menu vào `app/layout/menu.ts`.
5. Chuỗi hiển thị thêm vào **cả** `shared/i18n/vi.ts` và `en.ts`.
6. Bảng phân trang: `useTableQuery` + `DataTable`; form: antd `Form` + `zodRule(schema)` + `parseForm(Body, values)`
   trước khi gọi API, `applyServerErrors(form, error)` khi API trả 400.

## Gói `@phonics/contracts` (GitHub Packages)

Schema / type / hằng số dùng chung với API là gói `@lvhau1529/phonics-contracts` (phát hành từ repo phonics-api), cài qua alias
`"@phonics/contracts": "npm:@lvhau1529/phonics-contracts@^1"` nên code vẫn `import … from '@phonics/contracts'`.
GitHub Packages cần token kể cả khi chỉ đọc; pnpm **không** đọc token trong `.npmrc` của repo, nên đặt ở cấp user:

- Máy dev: tạo GitHub PAT (classic) quyền `read:packages`, rồi
  `pnpm config set //npm.pkg.github.com/:_authToken <token> --location=user`.
- CI (GitHub Actions): đã cấu hình sẵn bằng `GITHUB_TOKEN`; ở trang package `phonics-contracts` > Package settings >
  Manage Actions access, thêm repo này với quyền Read.
- Vercel: biến môi trường `NPM_RC` gồm 2 dòng `@lvhau1529:registry=https://npm.pkg.github.com` và
  `//npm.pkg.github.com/:_authToken=<token>`.

Nâng version: `pnpm up @phonics/contracts` rồi commit lockfile. Sửa contracts và thấy ngay ở app (không cần phát hành):
chạy qua launcher phonics-dev (`pnpm dev`).

## Deploy

Vercel, _Root Directory_ = gốc repo (`vercel.json`: build bằng `pnpm run build`, rewrite SPA về `index.html`).
Đặt `NPM_RC` (token đọc GitHub Packages, xem trên), `VITE_API_URL`, `VITE_GAME_URL` trong project settings.
