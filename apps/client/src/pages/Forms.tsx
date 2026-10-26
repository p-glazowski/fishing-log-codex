import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Lure, FishCatch } from '@lurelog/shared';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { Loading, Failure, PageHeading } from '../components/common';
import { RecordForm } from '../features/records/RecordForm';
export { Field } from '../components/forms/Field';
export default function Forms({ kind }: { kind: 'lure' | 'catch' }) {
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
        Back to {isLure ? 'collection' : 'journal'}
      </Link>
      <PageHeading
        eyebrow={
          edit
            ? 'REFINE THE DETAILS'
            : isLure
              ? 'MAKE ROOM IN THE TACKLE BOX'
              : 'ANOTHER STORY TO TELL'
        }
        title={
          edit ? `Edit ${isLure ? 'lure' : 'catch'}` : isLure ? 'Add a new lure' : 'Log a new catch'
        }
        description={
          isLure
            ? 'The details today. The possibilities tomorrow.'
            : 'Keep the details of a day well spent.'
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
