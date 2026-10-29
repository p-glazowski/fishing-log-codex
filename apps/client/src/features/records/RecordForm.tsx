import { t, canonicalSpecies, useTranslation } from '../../lib/i18n';
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { returnPath } from '../../lib/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm, type FieldValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  lureSchema,
  catchSchema,
  type Lure,
  type FishCatch,
  type PhotoPosition,
} from '@lurelog/shared';
import { toast } from 'sonner';
import { api, ApiError, data, json, errorMessage, upload, lureOf } from '../../lib/api';
import { ImageUpload } from '../../components/media/ImageUpload';
import { PhotoRemovalNotice } from '../../components/media/PhotoRemovalNotice';
import { RecordEssentials } from './RecordFields';
import { RecordAdditionalSection } from './RecordAdditionalSection';
import { RecordActions } from './RecordActions';
import { useUnsavedChanges } from '../../components/navigation/UnsavedChanges';
function localDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
export function RecordForm({
  kind,
  initial,
  lureId,
}: {
  kind: 'lure' | 'catch';
  initial?: Lure | FishCatch;
  lureId?: string;
}) {
  useTranslation();

  const isLure = kind === 'lure';
  const schema = isLure ? lureSchema : catchSchema;
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const originalPosition = (initial as FishCatch)?.photoPosition ?? { x: 50, y: 50 };
  const [photoPosition, setPhotoPosition] = useState<PhotoPosition>(originalPosition);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedId = useRef<string | null>(null);
  const initialValues: FieldValues = initial
    ? Object.fromEntries(Object.entries(initial).filter(([key]) => key in schema.shape))
    : isLure
      ? { type: 'Hard Bait' }
      : { caughtAt: localDateTime(new Date()), lureId: lureId ?? '' };
  if (initial && !isLure) {
    const fish = initial as FishCatch;
    initialValues.lureId = typeof fish.lureId === 'string' ? fish.lureId : lureOf(fish)?._id;
    initialValues.caughtAt = localDateTime(new Date(fish.caughtAt));
  }
  if (initialValues.purchaseDate)
    initialValues.purchaseDate = String(initialValues.purchaseDate).slice(0, 10);
  const form = useForm({
    resolver: zodResolver(schema) as unknown as Resolver<FieldValues>,
    defaultValues: initialValues,
  });
  const { dirtyFields } = form.formState;
  const allowNavigation = useUnsavedChanges(
    Object.keys(dirtyFields).length > 0 ||
      !!file ||
      removeImage ||
      photoPosition.x !== originalPosition.x ||
      photoPosition.y !== originalPosition.y,
  );
  async function submit(values: FieldValues) {
    setSaving(true);
    setError('');
    try {
      if (
        !isLure &&
        typeof values.caughtAt === 'string' &&
        (!initial || dirtyFields.caughtAt) &&
        localDateTime(new Date(values.caughtAt)) !== values.caughtAt
      ) {
        form.setError('caughtAt', { message: t('Choose a valid local date and time.') });
        return;
      }
      if (!isLure) {
        try {
          await api.lure(String(values.lureId));
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            form.setValue('lureId', '', { shouldDirty: true });
            form.setError('lureId', {
              message: t('That lure is no longer in your collection. Choose another lure.'),
            });
            await client.invalidateQueries({ queryKey: ['lure-options'] });
            return;
          }
          throw error;
        }
      }
      if (!isLure && typeof values.species === 'string')
        values.species = canonicalSpecies(values.species);
      if (!isLure) values.photoPosition = photoPosition;
      const base = isLure ? '/lures' : '/catches';
      let recordId = initial?._id ?? savedId.current;
      if (!isLure && typeof values.caughtAt === 'string') {
        values.caughtAt =
          initial && !dirtyFields.caughtAt
            ? (initial as FishCatch).caughtAt
            : new Date(values.caughtAt).toISOString();
      }
      if (!recordId) {
        const result = await data<{ _id: string }>(base, { method: 'POST', body: json(values) });
        recordId = result._id;
        savedId.current = recordId;
      } else await data(`${base}/${recordId}`, { method: 'PATCH', body: json(values) });
      if (file) await upload(`${base}/${recordId}/${isLure ? 'image' : 'photo'}`, file);
      else if (removeImage)
        await data(`${base}/${recordId}/${isLure ? 'image' : 'photo'}`, { method: 'DELETE' });
      await client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      const continueToCatch = isLure && !initial && params.get('next') === 'catch';
      allowNavigation();
      toast.success(t(continueToCatch ? 'Lure added. Now log your catch.' : 'Record saved'));
      navigate(continueToCatch ? `/lures/${recordId}/catches/new` : `${base}/${recordId}`, {
        state: location.state,
      });
    } catch (e) {
      setError(
        [
          t(errorMessage(e)),
          savedId.current ? t('Your record is saved. Retry to finish the photo upload.') : '',
        ]
          .filter(Boolean)
          .join(' '),
      );
    } finally {
      setSaving(false);
    }
  }
  const image = isLure ? (initial as Lure)?.image?.url : (initial as FishCatch)?.photo?.url;
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(submit)}
        className="record-form"
        data-kind={kind}
      >
        <section className="panel form-section record-essentials">
          <div className="form-section-heading">
            <span className="step-number">01</span>
            <div>
              <h2>{isLure ? t('The essentials') : t('The catch')}</h2>
            </div>
          </div>
          <RecordEssentials kind={kind} />
        </section>
        <section className="panel form-section record-photo">
          <h2>{isLure ? t('Lure photo') : t('Catch photo')}</h2>
          <p className="muted">
            {isLure ? t('Make it easy to spot your favorite.') : t('Optional')}
          </p>
          <ImageUpload
            file={file}
            existing={removeImage ? undefined : image}
            onRemoveExisting={() => setRemoveImage(true)}
            compact={!isLure}
            onChange={(next) => {
              setFile(next);
              if (!isLure) setPhotoPosition(next ? { x: 50, y: 50 } : originalPosition);
            }}
            position={!isLure ? photoPosition : undefined}
            onPositionChange={!isLure ? setPhotoPosition : undefined}
          />
          {removeImage && !file && <PhotoRemovalNotice onUndo={() => setRemoveImage(false)} />}
        </section>
        <RecordAdditionalSection kind={kind} initial={initial} />
        <RecordActions
          kind={kind}
          editing={!!initial}
          saving={saving}
          error={error}
          state={location.state}
          cancelTo={
            initial
              ? `/${isLure ? 'lures' : 'catches'}/${initial._id}`
              : isLure
                ? '/lures'
                : returnPath(location.state, lureId ? `/lures/${lureId}` : '/catches')
          }
        />
      </form>
    </FormProvider>
  );
}
