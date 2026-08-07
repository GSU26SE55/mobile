import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KEY } from '@/src/lib/queryKeys';
import { incidentService } from '../services/incident.service';
import { ResolveIncidentPayload } from '../types/incident.types';

// Staff — Open/Acknowledged → Resolved kèm resolutionNote (5–2000 ký tự).
export function useResolveIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResolveIncidentPayload }) =>
      incidentService.resolve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY.incidents });
    },
  });
}
