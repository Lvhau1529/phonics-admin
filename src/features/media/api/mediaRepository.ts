/** Repository media: presign / complete / detail — PUT file thực hiện ở `MediaService` qua `putFile` */
import {
  ENDPOINTS,
  MediaView,
  PresignMediaResponse,
  type CompleteMediaBody,
  type PresignMediaBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const mediaRepository = {
  presign: (body: PresignMediaBody) =>
    request(ENDPOINTS.media.presign, { method: HttpMethod.POST, body, schema: PresignMediaResponse }),
  complete: (id: string, body: CompleteMediaBody) =>
    request(ENDPOINTS.media.complete(id), { method: HttpMethod.POST, body, schema: MediaView }),
  detail: (id: string) => request(ENDPOINTS.media.detail(id), { schema: MediaView }),
};
