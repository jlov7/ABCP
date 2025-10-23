import { http, HttpResponse } from 'msw';
import { createMockTimelineData } from '@/utils/mockData';

const apiBase = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL ?? 'http://localhost:4000';

export const handlers = [
  http.get(`${apiBase}/runs/:runId/summary`, () => {
    const data = createMockTimelineData();
    return HttpResponse.json({
      actions: data.actions,
      observations: data.observations,
      decisions: data.decisions,
      evidenceAvailable: data.evidenceAvailable
    });
  })
];
