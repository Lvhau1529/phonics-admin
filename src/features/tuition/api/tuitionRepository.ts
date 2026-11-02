/** Repository học phí tạm tính: `ENDPOINTS.attendance.tuitionOverview` (ADMIN) + `ENDPOINTS.students.tuition` */
import { ENDPOINTS, StudentTuitionResponse, TuitionOverview, type TuitionQuery } from '@phonics/contracts';
import { request } from '@/shared/api/client';

export const tuitionRepository = {
  overview: (query: TuitionQuery) =>
    request(ENDPOINTS.attendance.tuitionOverview, { query, schema: TuitionOverview }),
  student: (studentId: string, query: TuitionQuery) =>
    request(ENDPOINTS.students.tuition(studentId), { query, schema: StudentTuitionResponse }),
};
