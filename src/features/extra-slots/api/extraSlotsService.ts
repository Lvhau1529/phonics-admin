/**
 * Service học thêm: DTO → model (`ExtraSlotModel`, `SlotStudentModel`, `ExtraRateModel`, `SlotAssignmentModel`) + hook
 * React Query. Khoá chung prefix `qk.extraSlots.all` để đổi ca / lịch / giá là làm mới cả màn ca lẫn tab của học sinh.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateExtraSlotBody,
  CreateSlotAssignmentBody,
  CreateSlotRateBody,
  CreateStudentRateBody,
  MoveSlotAssignmentBody,
  UpdateExtraSlotBody,
  UpdateSlotAssignmentBody,
} from '@phonics/contracts';
import { extraSlotsRepository } from '@/features/extra-slots/api/extraSlotsRepository';
import {
  ExtraRateModel,
  ExtraSlotModel,
  SlotAssignmentModel,
  SlotStudentModel,
  type StudentExtra,
} from '@/features/extra-slots/models/ExtraSlotModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

const api = {
  list: async (query: QueryParams) =>
    (await extraSlotsRepository.list(query)).items.map((s) => new ExtraSlotModel(s)),
  detail: async (id: string) => new ExtraSlotModel(await extraSlotsRepository.detail(id)),
  create: async (body: CreateExtraSlotBody) => new ExtraSlotModel(await extraSlotsRepository.create(body)),
  update: async (id: string, body: UpdateExtraSlotBody) =>
    new ExtraSlotModel(await extraSlotsRepository.update(id, body)),
  archive: (id: string) => extraSlotsRepository.archive(id),
  setTeachers: async (id: string, teacherIds: string[]) =>
    new ExtraSlotModel(await extraSlotsRepository.setTeachers(id, teacherIds)),
  students: async (id: string, date: string) =>
    (await extraSlotsRepository.students(id, date)).items.map((s) => new SlotStudentModel(s)),
  slotRates: async (id: string) =>
    (await extraSlotsRepository.slotRates(id)).items.map((r) => new ExtraRateModel(r)),
  createSlotRate: async (id: string, body: CreateSlotRateBody) =>
    new ExtraRateModel(await extraSlotsRepository.createSlotRate(id, body)),

  studentExtra: async (studentId: string): Promise<StudentExtra> => {
    const res = await extraSlotsRepository.studentExtra(studentId);
    return {
      assignments: res.assignments.map((a) => new SlotAssignmentModel(a)),
      rates: res.rates?.map((r) => new ExtraRateModel(r)) ?? null,
      appliedRates: res.appliedRates,
      canManageSchedule: res.canManageSchedule,
      canManagePricing: res.canManagePricing,
    };
  },
  createAssignment: async (studentId: string, body: CreateSlotAssignmentBody) =>
    new SlotAssignmentModel(await extraSlotsRepository.createAssignment(studentId, body)),
  updateAssignment: async (studentId: string, assignmentId: string, body: UpdateSlotAssignmentBody) =>
    new SlotAssignmentModel(await extraSlotsRepository.updateAssignment(studentId, assignmentId, body)),
  moveAssignment: async (studentId: string, assignmentId: string, body: MoveSlotAssignmentBody) =>
    new SlotAssignmentModel(await extraSlotsRepository.moveAssignment(studentId, assignmentId, body)),
  createStudentRate: async (studentId: string, body: CreateStudentRateBody) =>
    new ExtraRateModel(await extraSlotsRepository.createStudentRate(studentId, body)),
};

/** Mọi dữ liệu học thêm (danh sách ca, chi tiết ca, học sinh của ca, giá, tab của học sinh) */
function useInvalidateExtra() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: qk.extraSlots.all });
}

export const ExtraSlotsService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.extraSlots.list(params), queryFn: () => api.list(params) }),

  /** Ô chọn ca: ca đang hoạt động (GV chỉ thấy ca mình dạy — server lọc) */
  useOptions: () =>
    useQuery({ queryKey: qk.extraSlots.list({}), queryFn: () => api.list({}), staleTime: 60_000 }),

  useDetail: (id: string | undefined) =>
    useQuery({ queryKey: qk.extraSlots.detail(id ?? ''), queryFn: () => api.detail(id!), enabled: !!id }),

  useStudents: (id: string, date: string) =>
    useQuery({ queryKey: qk.extraSlots.students(id, date), queryFn: () => api.students(id, date) }),

  useSlotRates: (id: string, enabled: boolean) =>
    useQuery({ queryKey: qk.extraSlots.rates(id), queryFn: () => api.slotRates(id), enabled }),

  useStudentExtra: (studentId: string) =>
    useQuery({ queryKey: qk.extraSlots.student(studentId), queryFn: () => api.studentExtra(studentId) }),

  useCreate() {
    const invalidate = useInvalidateExtra();
    return useMutation({ mutationFn: api.create, onSuccess: invalidate });
  },

  useUpdate() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateExtraSlotBody }) => api.update(id, body),
      onSuccess: invalidate,
    });
  },

  useArchive() {
    const invalidate = useInvalidateExtra();
    return useMutation({ mutationFn: api.archive, onSuccess: invalidate });
  },

  useSetTeachers() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: ({ id, teacherIds }: { id: string; teacherIds: string[] }) =>
        api.setTeachers(id, teacherIds),
      onSuccess: invalidate,
    });
  },

  useCreateSlotRate() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: CreateSlotRateBody }) => api.createSlotRate(id, body),
      onSuccess: invalidate,
    });
  },

  useCreateAssignment() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: ({ studentId, body }: { studentId: string; body: CreateSlotAssignmentBody }) =>
        api.createAssignment(studentId, body),
      onSuccess: invalidate,
    });
  },

  useUpdateAssignment() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: (v: { studentId: string; assignmentId: string; body: UpdateSlotAssignmentBody }) =>
        api.updateAssignment(v.studentId, v.assignmentId, v.body),
      onSuccess: invalidate,
    });
  },

  useMoveAssignment() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: (v: { studentId: string; assignmentId: string; body: MoveSlotAssignmentBody }) =>
        api.moveAssignment(v.studentId, v.assignmentId, v.body),
      onSuccess: invalidate,
    });
  },

  useCreateStudentRate() {
    const invalidate = useInvalidateExtra();
    return useMutation({
      mutationFn: ({ studentId, body }: { studentId: string; body: CreateStudentRateBody }) =>
        api.createStudentRate(studentId, body),
      onSuccess: invalidate,
    });
  },
};
