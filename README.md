# @phonics/admin — Web Admin Phonics Arcade

Trang quản trị cho **admin** và **giáo viên**: tổng quan, lớp học, học sinh, sổ điểm, cộng điểm thưởng, mở khoá
game, phân quyền, nhật ký, báo cáo xlsx / pdf. Giao diện tiếng Việt.

Stack ([ADR 0008](../../docs/adr/0008-admin-stack.md)): React 19 + Vite 8 + TypeScript 7 + Ant Design 5 +
TanStack Query 5 + React Router 7 + Recharts + dayjs + zod (schema dùng chung từ `@phonics/contracts`).

## Chạy

```bash
# ở root
pnpm install
pnpm --filter @phonics/contracts build   # lần đầu (admin import type / schema từ dist)
pnpm dev:admin                           # http://localhost:5174 — cần API chạy (pnpm dev:api)

# trong apps/admin
pnpm dev          # vite --port 5174
pnpm build        # typecheck + vite build → dist/
pnpm preview      # xem bản build (port 4174)
pnpm typecheck    # tsc (src) + tsc (vite.config)
pnpm lint         # eslint (flat config ở root)
pnpm test         # vitest (jsdom + Testing Library)
```

Tài khoản demo (API seed với `SEED_DEMO=true`): admin `admin@phonics.local` (mật khẩu trong `apps/api/.env`
`ADMIN_PASSWORD`), giáo viên `teacher1@demo.local` / `Demo1234!`. Học sinh **không** đăng nhập được admin.

## Env

Sao chép `.env.example` → `.env`:

| Biến            | Mặc định                | Ý nghĩa                                                               |
| --------------- | ----------------------- | --------------------------------------------------------------------- |
| `VITE_API_URL`  | `http://localhost:3000` | Gốc API (admin gọi `${VITE_API_URL}/api/...`)                         |
| `VITE_GAME_URL` | `http://localhost:5173` | Gốc app game — ảnh avatar preset lấy từ `${VITE_GAME_URL}/assets/...` |

API phải cho phép origin của admin trong `CORS_ORIGINS` và expose header `Content-Disposition` (đã có sẵn).

## Cấu trúc

```text
src/
├── main.tsx                 Mount: Providers + RouterProvider
├── app/
│   ├── providers.tsx        ConfigProvider (locale vi, theme tím) + antd App + QueryClient + khôi phục phiên
│   ├── router.tsx           createBrowserRouter; trang tải lười; RequireAuth → AppShell → RequireRole(ADMIN)
│   ├── routes.ts            Hằng số đường dẫn (ROUTES.classDetail(id)...)
│   ├── layout/              AppShell (sider + header), menu.ts (mục menu + role)
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
    ├── hooks/               useTableQuery (bảng ↔ URL), useDebouncedValue
    ├── ui/                  PageHeader, DataTable, RangePicker, GameSelect, AvatarImg, RoleTag, ErrorAlert…
    ├── utils/               format (ngày, số), zodForm (antd ↔ zod), download, range, avatar
    ├── i18n/vi.ts           MỌI chuỗi giao diện (t.xxx)
    ├── theme.ts             Token antd (#7A3BB8, sider #3D1C6E, radius 8)
    └── config.ts            VITE_API_URL, VITE_GAME_URL, khoá localStorage
```

## Đăng nhập & phân quyền

- `POST /auth/login` (header `X-Refresh-Transport: body`) → access token giữ trong bộ nhớ (`shared/api/client`),
  `{ user, refreshToken }` lưu localStorage `phonics-admin:auth`. Khởi động: refresh → `GET /auth/me` (user +
  `permissions` hiệu lực). Mọi lời gọi 401 → refresh một lần (gộp các lời gọi đồng thời) → gọi lại; thất bại →
  đăng xuất.
- Role `STUDENT` bị từ chối ngay sau khi đăng nhập (thu hồi phiên vừa cấp).
- Menu lọc theo role (`app/layout/menu.ts`); route ADMIN bọc `RequireRole`. Nút cần quyền dùng
  `useAuth().can('games.unlock')` để ẩn / disable (ADMIN luôn có mọi quyền). Giáo viên chỉ thấy lớp mình — server
  lọc, client không cần làm gì thêm.

## Thêm trang mới

1. Contracts: schema / `ENDPOINTS` đã có? Chưa thì thêm ở `packages/contracts` rồi `pnpm --filter @phonics/contracts build`.
2. `src/features/<feature>/api.ts`: hàm gọi `request(ENDPOINTS.x, { schema })`.
3. `src/features/<feature>/hooks.ts`: `useQuery({ queryKey: qk.<feature>.list(params) })`; thêm khoá vào
   `shared/api/queryKeys.ts`; mutation `onSuccess` invalidate theo prefix.
4. Trang trong `pages/<Name>Page.tsx` (`export default`), đăng ký ở `app/router.tsx` (bọc `adminOnly` nếu cần),
   thêm đường dẫn vào `app/routes.ts`, mục menu vào `app/layout/menu.ts`.
5. Chuỗi hiển thị thêm vào `shared/i18n/vi.ts`.
6. Bảng phân trang: `useTableQuery` + `DataTable`; form: antd `Form` + `zodRule(schema)` + `parseForm(Body, values)`
   trước khi gọi API, `applyServerErrors(form, error)` khi API trả 400.

## Deploy

Vercel, _Root Directory_ = `apps/admin` (`vercel.json`: build bằng `turbo run build --filter=@phonics/admin`,
rewrite SPA về `index.html`). Đặt `VITE_API_URL`, `VITE_GAME_URL` trong project settings.
