import { t } from '../../lib/i18n';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { request, errorMessage } from '../../lib/api';
export function useDelete(path: string, back: string) {
  const client = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => request<void>(path, { method: 'DELETE' }),
    onSuccess: async () => {
      await client.invalidateQueries({
        predicate: (q) => q.queryKey[0] !== 'session',
        refetchType: 'none',
      });
      toast.success(t('Deleted successfully'));
      navigate(back, { replace: true });
    },
    onError: (e) => toast.error(t(errorMessage(e))),
  });
}
