# Quy tắc cho Claude — apps/admin (@phonics/admin)

Đọc [README.md](README.md) (cấu trúc, chạy, env) và rule chung ở [../../CLAUDE.md](../../CLAUDE.md). Stack:
React 19 + Vite 8 + TS 7 + Ant Design 5 + TanStack Query 5 + React Router 7 + Recharts ([ADR 0008](../../docs/adr/0008-admin-stack.md)).

## Kiến trúc

- **Feature folder**: `src/features/<feature>/{api.ts,hooks.ts,pages/,components/}`. Code dùng chung ở
  `src/shared`. `shared` không import `features`; `features` import nhau được (vd `ClassSelect` của classes).
- **Alias `@/`** → `src`. Không dùng `../`. Import kiểu: `import { type X }` (inline).
- **Không CSS mới** (không SCSS module / Tailwind): dùng token antd, prop `style` nhỏ, component `Flex`/`Space`.
- **Chuỗi UI chỉ ở `src/shared/i18n/vi.ts`** (`t.xxx`). Không hard-code tiếng Việt trong component. Mã lỗi API
  → `t.errors[code]`. Identifier / comment: identifier tiếng Anh, comment tiếng Việt.

## API & dữ liệu

- Gọi API qua `request(path, { method, body, query, schema })` trong `shared/api/client.ts`; đường dẫn từ
  `ENDPOINTS` của `@phonics/contracts`; **luôn truyền `schema`** (zod contracts) để parse response. Không `fetch`
  trực tiếp trong feature.
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
  Danh sách quyền: `PERMISSIONS` trong contracts (trang Phân quyền tự hiện quyền mới).
- Giáo viên chỉ thấy lớp mình: server lọc; client không lọc thêm.

## Thêm trang / endpoint (checklist)

1. Contracts có schema + `ENDPOINTS`? Chưa có → thêm ở `packages/contracts`, build, rồi mới dùng.
2. `features/<x>/api.ts` → `features/<x>/hooks.ts` (+ khoá ở `queryKeys.ts`).
3. `pages/XPage.tsx` export **default** (lazy route) + named; đăng ký `app/router.tsx`, `app/routes.ts`, menu.
4. Chuỗi → `i18n/vi.ts`. Quyền → `can()`. Test hook / util nếu có logic (Vitest + jsdom, file `*.test.ts(x)`).
5. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` xanh (trong `apps/admin`), rồi commit.

## Không làm

- Không thêm thư viện i18n / state manager / CSS framework. Không dùng `any`. Không hiện message thô của server.
- Không start / stop dev server của phiên chat khác; không `git push` khi người dùng chưa yêu cầu.
