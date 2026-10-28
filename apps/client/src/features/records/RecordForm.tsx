import { t, canonicalSpecies, useTranslation } from '../../lib/i18n';
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, data, json, errorMessage, upload, lureOf } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { ImageUpload } from '../../components/media/ImageUpload';
import { RecordEssentials, RecordAdditional } from './RecordFields';
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
  const originalPosition = (initial as FishCatch)?.photoPosition ?? { x: 50, y: 50 };
  const [photoPosition, setPhotoPosition] = useState<PhotoPosition>(originalPosition);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedId = useRef<string | null>(null);
  const initialValues: FieldValues = initial
    ? Object.fromEntries(Object.entries(initial).filter(([key]) => key in schema.shape))
    : isLure
      ? { type: 'Hard Bait' }
      : { caughtAt: new Date().toISOString().slice(0, 16), lureId: lureId ?? '' };
  if (initial && !isLure) {
    const fish = initial as FishCatch;
    initialValues.lureId = typeof fish.lureId === 'string' ? fish.lureId : lureOf(fish)?._id;
    initialValues.caughtAt = new Date(fish.caughtAt).toISOString().slice(0, 16);
  }
  if (initialValues.purchaseDate)
    initialValues.purchaseDate = String(initialValues.purchaseDate).slice(0, 10);
  const form = useForm({
    resolver: zodResolver(schema) as unknown as Resolver<FieldValues>,
    defaultValues: initialValues,
  });
  async function submit(values: FieldValues) {
    setSaving(true);
    setError('');
    try {
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
      if (!isLure && typeof values.caughtAt === 'string' && !values.caughtAt.endsWith('Z'))
        values.caughtAt = new Date(values.caughtAt + 'Z').toISOString();
      if (!recordId) {
        const result = await data<{ _id: string }>(base, { method: 'POST', body: json(values) });
        recordId = result._id;
        savedId.current = recordId;
      } else await data(`${base}/${recordId}`, { method: 'PATCH', body: json(values) });
      if (file) await upload(`${base}/${recordId}/${isLure ? 'image' : 'photo'}`, file);
      await client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      toast.success(t('Record saved'));
      navigate(`${base}/${recordId}`);
      if (isLure && !initial) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
        <div className="form-main">
          <section className="panel form-section">
            <div className="form-section-heading">
              <span className="step-number">01</span>
              <div>
                <h2>{isLure ? t('The essentials') : t('The catch')}</h2>
                <p>
                  {isLure
                    ? t('A few details to give your lure a home.')
                    : t('Start with the fish and the lure that made it happen.')}
                </p>
              </div>
            </div>
            <RecordEssentials kind={kind} />
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span className="step-number">02</span>
              <div>
                <h2>{isLure ? t('A little more detail') : t('Set the scene')}</h2>
                <p>{t('Optional details you’ll be glad you kept.')}</p>
              </div>
            </div>
            <RecordAdditional kind={kind} />
          </section>
        </div>
        <aside className="form-aside">
          <section className="panel form-section">
            <h2>{isLure ? t('Lure photo') : t('Keep the moment')}</h2>
            <p className="muted">
              {isLure
                ? t('Make it easy to spot your favorite.')
                : t('A photo brings the story back to life.')}
            </p>
            <ImageUpload
              file={file}
              existing={image}
              onChange={(next) => {
                setFile(next);
                if (!isLure) setPhotoPosition(next ? { x: 50, y: 50 } : originalPosition);
              }}
              position={!isLure ? photoPosition : undefined}
              onPositionChange={!isLure ? setPhotoPosition : undefined}
            />
          </section>
          <div className="form-tip">
            <Info size={19} />
            <p>
              {isLure
                ? t('Start with the basics. You can add more details anytime.')
                : t('Every catch counts. Photos and measurements are optional.')}
            </p>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          <Button className="full-width" disabled={saving}>
            <Check size={18} />
            {saving
              ? t('Saving your story…')
              : initial
                ? t('Save changes')
                : isLure
                  ? t('Add to collection')
                  : t('Save catch')}
          </Button>
          <Button variant="ghost" asChild className="full-width">
            <Link
              to={
                initial
                  ? `/${isLure ? 'lures' : 'catches'}/${initial._id}`
                  : isLure
                    ? '/lures'
                    : '/catches'
              }
            >
              {t('Cancel')}
            </Link>
          </Button>
        </aside>
      </form>
    </FormProvider>
  );
}
