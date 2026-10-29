import { t, useTranslation } from '../lib/i18n';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Lure, FishCatch } from '@lurelog/shared';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Loading, Failure, PageHeading } from '../components/common';
import { RecordForm } from '../features/records/RecordForm';
import { FirstSteps } from '../components/dashboard/FirstSteps';
import { returnPath, backLabel } from '../lib/navigation';
export { Field } from '../components/forms/Field';
export default function Forms({ kind }: { kind: 'lure' | 'catch' }) {
  useTranslation();

  const { id } = useParams();
  const location = useLocation();
  const edit = location.pathname.endsWith('/edit');
  const isLure = kind === 'lure';
  const back = edit
    ? `/${isLure ? 'lures' : 'catches'}/${id}`
    : returnPath(location.state, !isLure && id ? `/lures/${id}` : isLure ? '/lures' : '/catches');
  const query = useQuery<Lure | FishCatch>({
    queryKey: [kind, id],
    queryFn: () => (isLure ? api.lure(id!) : api.catch(id!)),
    enabled: edit && !!id,
  });
  const needsLure = !isLure && !edit;
  const collection = useQuery({
    queryKey: ['lure-availability'],
    queryFn: () => api.lures('limit=1'),
    enabled: needsLure,
    staleTime: 0,
  });
  if (needsLure && collection.isLoading) return <Loading />;
  if (needsLure && collection.isError)
    return <Failure error={collection.error} retry={() => void collection.refetch()} />;
  if (needsLure && collection.data?.total === 0) return <FirstSteps catchEntry />;
  if (edit && query.isLoading) return <Loading />;
  if (edit && query.isError) return <Failure error={query.error} />;
  return (
    <>
      <Link className="back-link" to={back} state={location.state}>
        <ArrowLeft size={16} />
        {t(backLabel(back))}
      </Link>
      {!edit ? (
        <header className="add-lure-heading">
          <h1>{isLure ? t('Add a new lure') : t('Log a new catch')}</h1>
          <p>
            {isLure
              ? t('Save its details now, and track the catches it brings later.')
              : t('Record your catch and the lure that brought it in.')}
          </p>
        </header>
      ) : (
        <PageHeading
          eyebrow={edit ? t('REFINE THE DETAILS') : t('ANOTHER STORY TO TELL')}
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
            isLure
              ? t('The details today. The possibilities tomorrow.')
              : t('Keep the details of a day well spent.')
          }
        />
      )}
      <RecordForm
        key={`${kind}-${id ?? 'new'}`}
        kind={kind}
        initial={edit ? query.data : undefined}
        lureId={!isLure && !edit ? id : undefined}
      />
    </>
  );
}
