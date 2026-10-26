import { useState, useRef, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FormProvider,
  useForm,
  useFormContext,
  type FieldValues,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  lureSchema,
  catchSchema,
  lureTypes,
  fishSpecies,
  type Lure,
  type FishCatch,
} from '@lurelog/shared';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api, data, json, errorMessage, upload, lureOf } from '../lib/api';
import { Button } from '../components/ui/button';
import { PageHeading, ImageUpload, Loading, Failure, Empty } from '../components/common';
export function Field({
  name,
  label,
  type = 'text',
  required = false,
  children,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  children?: ReactNode;
  placeholder?: string;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const props = register(name, {
    setValueAs: (v) =>
      v === ''
        ? type === 'number' || type === 'date' || children
          ? required
            ? undefined
            : null
          : ''
        : type === 'number'
          ? Number(v)
          : v,
  });
  const error = errors[name]?.message as string | undefined;
  return (
    <label className={type === 'textarea' ? 'field field-wide' : 'field'}>
      {label}
      {required && <span className="required">*</span>}
      {children ? (
        <select {...props} aria-invalid={!!error}>
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...props} rows={4} placeholder={placeholder} />
      ) : (
        <input
          {...props}
          type={type}
          step={type === 'number' ? 'any' : undefined}
          min={type === 'number' ? 0 : undefined}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      )}{' '}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
function RecordForm({
  kind,
  initial,
  lureId,
}: {
  kind: 'lure' | 'catch';
  initial?: Lure | FishCatch;
  lureId?: string;
}) {
  const isLure = kind === 'lure';
  const schema = isLure ? lureSchema : catchSchema;
  const client = useQueryClient();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedId = useRef<string | null>(null);
  const initialValues: FieldValues = initial
    ? Object.fromEntries(Object.entries(initial).filter(([key]) => key in schema.shape))
    : isLure
      ? { type: 'Crankbait' }
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
  const lures = useQuery({
    queryKey: ['lure-options'],
    queryFn: () => api.lures('limit=100&sort=name'),
    enabled: !isLure,
  });
  const selectedLure = useQuery({
    queryKey: ['lure', lureId],
    queryFn: () => api.lure(lureId!),
    enabled: !isLure && !!lureId,
  });
  const [lureSearch, setLureSearch] = useState('');
  const options = useQuery({
    queryKey: ['lure-search', lureSearch],
    queryFn: () => api.lures(`limit=100&search=${encodeURIComponent(lureSearch)}`),
    enabled: !isLure && !!lureSearch,
  });
  async function submit(values: FieldValues) {
    setSaving(true);
    setError('');
    try {
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
      toast.success(`${isLure ? 'Lure' : 'Catch'} ${initial ? 'updated' : 'added'} to your story`);
      navigate(`${base}/${recordId}`);
    } catch (e) {
      setError(
        `${errorMessage(e)}${savedId.current ? ' Your record is saved. Retry to finish the photo upload.' : ''}`,
      );
    } finally {
      setSaving(false);
    }
  }
  const image = isLure ? (initial as Lure)?.image?.url : (initial as FishCatch)?.photo?.url;
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(submit)} className="record-form">
        <div className="form-main">
          <section className="panel form-section">
            <div className="form-section-heading">
              <span className="step-number">01</span>
              <div>
                <h2>{isLure ? 'The essentials' : 'The catch'}</h2>
                <p>
                  {isLure
                    ? 'A few details to give your lure a home.'
                    : 'Start with the fish and the lure that made it happen.'}
                </p>
              </div>
            </div>
            <div className="fields-grid">
              {isLure ? (
                <>
                  <Field
                    name="name"
                    label="Model / name"
                    required
                    placeholder="e.g. Original Floater"
                  />
                  <Field name="brand" label="Brand" required placeholder="e.g. Rapala" />
                  <Field name="type" label="Lure type" required>
                    {lureTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Field>
                  <Field
                    name="lengthMm"
                    label="Length (mm)"
                    type="number"
                    required
                    placeholder="90"
                  />
                  <Field name="weightGrams" label="Weight (g)" type="number" placeholder="12" />
                  <Field name="color" label="Color / pattern" placeholder="e.g. Firetiger" />
                </>
              ) : (
                <>
                  <div className="field field-wide">
                    <label htmlFor="lure-option-search">
                      Find a lure
                      <input
                        id="lure-option-search"
                        value={lureSearch}
                        placeholder="Search your entire collection…"
                        onChange={(e) => setLureSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <Field name="lureId" label="Lure used" required>
                    <option value="">Choose a lure</option>
                    {selectedLure.data && (
                      <option value={selectedLure.data._id}>
                        {selectedLure.data.brand} {selectedLure.data.name}
                      </option>
                    )}
                    {initial && !isLure && lureOf(initial as FishCatch) && (
                      <option value={lureOf(initial as FishCatch)!._id}>
                        {lureOf(initial as FishCatch)!.brand} {lureOf(initial as FishCatch)!.name}
                      </option>
                    )}
                    {(lureSearch ? options : lures).data?.data.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.brand} {l.name} · {l.lengthMm} mm
                      </option>
                    ))}
                  </Field>
                  <div className="field">
                    <label htmlFor="species">
                      Fish species <span className="required">*</span>
                      <input
                        id="species"
                        list="species-list"
                        placeholder="Select or enter a species"
                        {...form.register('species')}
                      />
                      <datalist id="species-list">
                        {fishSpecies.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                      {form.formState.errors.species && (
                        <span role="alert" className="field-error">
                          {String(form.formState.errors.species.message)}
                        </span>
                      )}
                    </label>
                  </div>
                  <Field name="caughtAt" label="Date & time (UTC)" type="datetime-local" required />
                  <Field
                    name="location"
                    label="Fishing location"
                    placeholder="Your favorite stretch of water"
                  />
                  <Field name="lengthCm" label="Fish length (cm)" type="number" placeholder="65" />
                  <Field name="weightKg" label="Fish weight (kg)" type="number" placeholder="2.4" />
                </>
              )}
            </div>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span className="step-number">02</span>
              <div>
                <h2>{isLure ? 'A little more detail' : 'Set the scene'}</h2>
                <p>Optional details you’ll be glad you kept.</p>
              </div>
            </div>
            <div className="fields-grid">
              {isLure ? (
                <>
                  <Field name="buoyancy" label="Floating behavior">
                    <option value="">Not specified</option>
                    {['floating', 'sinking', 'suspending'].map((b) => (
                      <option key={b} value={b}>
                        {b[0].toUpperCase() + b.slice(1)}
                      </option>
                    ))}
                  </Field>
                  <Field
                    name="technique"
                    label="Fishing technique"
                    placeholder="e.g. Twitching, steady retrieve"
                  />
                  <Field name="purchaseDate" label="Purchase date" type="date" />
                  <Field
                    name="purchasePrice"
                    label="Purchase price (your currency)"
                    type="number"
                  />
                  <Field
                    name="description"
                    label="Notes"
                    type="textarea"
                    placeholder="What makes this lure special?"
                  />
                </>
              ) : (
                <>
                  <Field name="weather" label="Weather" placeholder="e.g. Overcast, light wind" />
                  <Field
                    name="waterConditions"
                    label="Water conditions"
                    placeholder="e.g. Clear water, 14°C"
                  />
                  <Field
                    name="notes"
                    label="Your story"
                    type="textarea"
                    placeholder="The spot, the retrieve, that moment on the line…"
                  />
                </>
              )}
            </div>
          </section>
        </div>
        <aside className="form-aside">
          <section className="panel form-section">
            <h2>{isLure ? 'Lure photo' : 'Keep the moment'}</h2>
            <p className="muted">
              {isLure
                ? 'Make it easy to spot your favorite.'
                : 'A photo brings the story back to life.'}
            </p>
            <ImageUpload file={file} onChange={setFile} existing={image} />
          </section>
          <div className="form-tip">
            <Info size={19} />
            <p>
              {isLure
                ? 'Start with the basics. You can add more details anytime.'
                : 'Every catch counts. Photos and measurements are optional.'}
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
              ? 'Saving your story…'
              : initial
                ? 'Save changes'
                : isLure
                  ? 'Add to collection'
                  : 'Save catch'}
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
              Cancel
            </Link>
          </Button>
        </aside>
      </form>
    </FormProvider>
  );
}
export default function Forms({ kind }: { kind: 'lure' | 'catch' }) {
  const { id } = useParams();
  const edit = location.pathname.endsWith('/edit');
  const isLure = kind === 'lure';
  const query = useQuery<Lure | FishCatch>({
    queryKey: [kind, id],
    queryFn: () => (isLure ? api.lure(id!) : api.catch(id!)),
    enabled: edit && !!id,
  });
  const lures = useQuery({
    queryKey: ['lure-options'],
    queryFn: () => api.lures('limit=100&sort=name'),
    enabled: !isLure && !edit,
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
      {!isLure && !edit && lures.isSuccess && !lures.data.total ? (
        <Empty
          title="First, a lure for your story."
          description="Add a lure to your collection before logging a catch."
          to="/lures/new"
          label="Add a lure"
        />
      ) : (
        <RecordForm
          key={`${kind}-${id ?? 'new'}`}
          kind={kind}
          initial={edit ? query.data : undefined}
          lureId={!isLure && !edit ? id : undefined}
        />
      )}
    </>
  );
}
