import { t, useTranslation } from '../lib/i18n';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Lure, FishCatch } from '@lurelog/shared';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Loading, Failure, PageHeading } from '../components/common';
import { RecordForm } from '../features/records/RecordForm';
export { Field } from '../components/forms/Field';
export default function Forms({ kind }: { kind: 'lure' | 'catch' }) {
  useTranslation();

  const { id } = useParams();
  const location = useLocation();
  const edit = location.pathname.endsWith('/edit');
  const isLure = kind === 'lure';
  const query = useQuery<Lure | FishCatch>({
    queryKey: [kind, id],
    queryFn: () => (isLure ? api.lure(id!) : api.catch(id!)),
    enabled: edit && !!id,
  });
  if (edit && query.isLoading) return <Loading />;
  if (edit && query.isError) return <Failure error={query.error} />;
  return (
    <>
      <Link className="back-link" to={isLure ? '/lures' : '/catches'}>
        <ArrowLeft size={16} />
        {isLure ? t('Back to collection') : t('Back to journal')}
      </Link>
      <PageHeading
        eyebrow={
          isLure && !edit ? undefined : edit ? t('REFINE THE DETAILS') : t('ANOTHER STORY TO TELL')
        }
        title={
          edit
            ? isLure
              ? t('Edit lure')
              : t('Edit catch')
            : isLure
              ? t('Add a new lure')
              : t('Log a new catch')
        }
        description={
          isLure && !edit
            ? undefined
            : isLure
              ? t('The details today. The possibilities tomorrow.')
              : t('Keep the details of a day well spent.')
        }
      />
      <RecordForm
        key={`${kind}-${id ?? 'new'}`}
        kind={kind}
        initial={edit ? query.data : undefined}
        lureId={!isLure && !edit ? id : undefined}
      />
    </>
  );
}
