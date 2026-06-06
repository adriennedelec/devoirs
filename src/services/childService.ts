import type { ChildDashboard } from '../types/api';
import { apiDelay, cloneApiPayload } from './apiClient';
import { childDashboardMock } from './mockData';

export async function getChildDashboard(childId: string): Promise<ChildDashboard> {
  await apiDelay();

  if (childId !== childDashboardMock.child.id) {
    throw new Error(`Aucun tableau de bord trouvé pour l’enfant ${childId}`);
  }

  return cloneApiPayload(childDashboardMock);
}
