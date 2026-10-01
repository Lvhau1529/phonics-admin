/** Đường dẫn trong admin — dùng hằng số / hàm thay vì ghép chuỗi tay ở component */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  teachers: '/teachers',
  classes: '/classes',
  classDetail: (id: string) => `/classes/${id}`,
  students: '/students',
  studentDetail: (id: string) => `/students/${id}`,
  games: '/games',
  gameDetail: (id: string) => `/games/${id}`,
  points: '/points',
  permissions: '/permissions',
  audit: '/audit',
  reports: '/reports',
  profile: '/profile',
} as const;
