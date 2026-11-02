/**
 * Repository phụ huynh: chỉ khai báo endpoint (`ENDPOINTS.guardians`, `ENDPOINTS.students.guardians`) + schema
 * contracts, trả DTO đúng như BE.
 */
import {
  ConvertPreview,
  ConvertResult,
  ENDPOINTS,
  FamilyAccountResponse,
  GuardianSummary,
  paginated,
  StudentGuardiansResponse,
  type ConvertFamilyBody,
  type CreateGuardianBody,
  type SetStudentGuardiansBody,
  type UpdateGuardianBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const GuardianPage = paginated(GuardianSummary);

export const guardiansRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.guardians.list, { query, schema: GuardianPage }),
  detail: (id: string) => request(ENDPOINTS.guardians.detail(id), { schema: GuardianSummary }),
  create: (body: CreateGuardianBody) =>
    request(ENDPOINTS.guardians.list, { method: HttpMethod.POST, body, schema: GuardianSummary }),
  update: (id: string, body: UpdateGuardianBody) =>
    request(ENDPOINTS.guardians.detail(id), { method: HttpMethod.PATCH, body, schema: GuardianSummary }),
  createFamilyAccount: (id: string) =>
    request(ENDPOINTS.guardians.familyAccount(id), {
      method: HttpMethod.POST,
      schema: FamilyAccountResponse,
    }),
  convertPreview: (id: string, body: ConvertFamilyBody) =>
    request(ENDPOINTS.guardians.convertPreview(id), {
      method: HttpMethod.POST,
      body,
      schema: ConvertPreview,
    }),
  convert: (id: string, body: ConvertFamilyBody) =>
    request(ENDPOINTS.guardians.convert(id), { method: HttpMethod.POST, body, schema: ConvertResult }),
  setStudentGuardians: (studentId: string, body: SetStudentGuardiansBody) =>
    request(ENDPOINTS.students.guardians(studentId), {
      method: HttpMethod.PUT,
      body,
      schema: StudentGuardiansResponse,
    }),
};
