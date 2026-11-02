/**
 * Repository học thêm: chỉ khai báo endpoint (`ENDPOINTS.extraSlots`, lịch / giá trong `ENDPOINTS.students`) + schema
 * contracts, trả DTO đúng như BE.
 */
import {
  ApplyToSessionsResponse,
  ENDPOINTS,
  ExtraRate,
  ExtraRatesResponse,
  ExtraSlot,
  ExtraSlotsResponse,
  SlotAssignment,
  SlotStudentsResponse,
  StudentExtraResponse,
  type CreateExtraSlotBody,
  type CreateSlotAssignmentBody,
  type CreateSlotRateBody,
  type CreateStudentRateBody,
  type MoveSlotAssignmentBody,
  type UpdateExtraSlotBody,
  type UpdateSlotAssignmentBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

export const extraSlotsRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.extraSlots.list, { query, schema: ExtraSlotsResponse }),
  detail: (id: string) => request(ENDPOINTS.extraSlots.detail(id), { schema: ExtraSlot }),
  create: (body: CreateExtraSlotBody) =>
    request(ENDPOINTS.extraSlots.list, { method: HttpMethod.POST, body, schema: ExtraSlot }),
  update: (id: string, body: UpdateExtraSlotBody) =>
    request(ENDPOINTS.extraSlots.detail(id), { method: HttpMethod.PATCH, body, schema: ExtraSlot }),
  archive: (id: string) => request<void>(ENDPOINTS.extraSlots.detail(id), { method: HttpMethod.DELETE }),
  setTeachers: (id: string, teacherIds: string[]) =>
    request(ENDPOINTS.extraSlots.teachers(id), {
      method: HttpMethod.PUT,
      body: { teacherIds },
      schema: ExtraSlot,
    }),
  students: (id: string, date: string) =>
    request(ENDPOINTS.extraSlots.students(id), { query: { date }, schema: SlotStudentsResponse }),
  slotRates: (id: string) => request(ENDPOINTS.extraSlots.rates(id), { schema: ExtraRatesResponse }),
  createSlotRate: (id: string, body: CreateSlotRateBody) =>
    request(ENDPOINTS.extraSlots.rates(id), { method: HttpMethod.POST, body, schema: ExtraRate }),

  studentExtra: (studentId: string) =>
    request(ENDPOINTS.students.extra(studentId), { schema: StudentExtraResponse }),
  createAssignment: (studentId: string, body: CreateSlotAssignmentBody) =>
    request(ENDPOINTS.students.slotAssignments(studentId), {
      method: HttpMethod.POST,
      body,
      schema: SlotAssignment,
    }),
  updateAssignment: (studentId: string, assignmentId: string, body: UpdateSlotAssignmentBody) =>
    request(ENDPOINTS.students.slotAssignment(studentId, assignmentId), {
      method: HttpMethod.PATCH,
      body,
      schema: SlotAssignment,
    }),
  moveAssignment: (studentId: string, assignmentId: string, body: MoveSlotAssignmentBody) =>
    request(ENDPOINTS.students.moveSlotAssignment(studentId, assignmentId), {
      method: HttpMethod.POST,
      body,
      schema: SlotAssignment,
    }),
  createStudentRate: (studentId: string, body: CreateStudentRateBody) =>
    request(ENDPOINTS.students.rates(studentId), { method: HttpMethod.POST, body, schema: ExtraRate }),
  /** Áp lịch mới vào các buổi đã xác nhận được liệt kê */
  applyAssignments: (studentId: string, sessionIds: string[]) =>
    request(ENDPOINTS.students.applySlotAssignments(studentId), {
      method: HttpMethod.POST,
      body: { sessionIds },
      schema: ApplyToSessionsResponse,
    }),
  /** Tính lại đơn giá các buổi đã xác nhận được liệt kê theo giá mới */
  applyRate: (rateId: string, sessionIds: string[]) =>
    request(ENDPOINTS.extraRates.apply(rateId), {
      method: HttpMethod.POST,
      body: { sessionIds },
      schema: ApplyToSessionsResponse,
    }),
};
