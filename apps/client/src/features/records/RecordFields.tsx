import { t as translate, useTranslation, validationMessage } from '../../lib/i18n';
import { useFormContext } from 'react-hook-form';
import { lureTypes, fishSpecies } from '@lurelog/shared';
import { Field } from '../../components/forms/Field';
import LurePicker from '../../components/lures/LurePicker';
export function RecordEssentials({ kind }: { kind: 'lure' | 'catch' }) {
  useTranslation();

  const isLure = kind === 'lure';
  const form = useFormContext();
  return (
    <div className="fields-grid">
      {isLure ? (
        <>
          <Field
            name="name"
            label={translate('Model / name')}
            required
            placeholder={translate('e.g. Original Floater')}
          />
          <Field
            name="brand"
            label={translate('Brand')}
            required
            placeholder={translate('e.g. Rapala')}
          />
          <Field name="type" label={translate('Lure type')} required>
            {lureTypes.map((t) => (
              <option key={t} value={t}>
                {translate(t)}
              </option>
            ))}
          </Field>
          <Field
            name="lengthMm"
            label={translate('Length (mm)')}
            type="number"
            required
            placeholder="90"
          />
          <Field
            name="weightGrams"
            label={translate('Weight (g)')}
            type="number"
            placeholder="12"
          />
          <Field
            name="color"
            label={translate('Color / pattern')}
            placeholder={translate('e.g. Firetiger')}
          />
        </>
      ) : (
        <>
          <LurePicker />
          <div className="field">
            <label htmlFor="species">
              {translate('Fish species')}
              <span className="required">*</span>
              <input
                id="species"
                list="species-list"
                aria-required="true"
                aria-invalid={!!form.formState.errors.species}
                aria-describedby={form.formState.errors.species ? 'species-error' : undefined}
                placeholder={translate('Select or enter a species')}
                {...form.register('species')}
              />
              <datalist id="species-list">
                {fishSpecies.map((s) => (
                  <option key={s} value={translate(s)} />
                ))}
              </datalist>
              {form.formState.errors.species && (
                <span id="species-error" role="alert" className="field-error">
                  {validationMessage(String(form.formState.errors.species.message))}
                </span>
              )}
            </label>
          </div>
          <Field
            name="caughtAt"
            label={translate('Date & time (local)')}
            type="datetime-local"
            required
          />
          <Field
            name="location"
            label={translate('Fishing location')}
            placeholder={translate('Your favorite stretch of water')}
          />
          <Field
            name="lengthCm"
            label={translate('Fish length (cm)')}
            type="number"
            placeholder="65"
          />
          <Field
            name="weightKg"
            label={translate('Fish weight (kg)')}
            type="number"
            placeholder="2.4"
          />
        </>
      )}
    </div>
  );
}
export function RecordAdditional({ kind }: { kind: 'lure' | 'catch' }) {
  useTranslation();

  const isLure = kind === 'lure';
  return (
    <div className="fields-grid">
      {isLure ? (
        <>
          <Field name="buoyancy" label={translate('Floating behavior')}>
            <option value="">{translate('Not specified')}</option>
            {['floating', 'sinking', 'suspending'].map((b) => (
              <option key={b} value={b}>
                {translate(b)}
              </option>
            ))}
          </Field>
          <Field
            name="technique"
            label={translate('Fishing technique')}
            placeholder={translate('e.g. Twitching, steady retrieve')}
          />
          <Field name="purchaseDate" label={translate('Purchase date')} type="date" />
          <Field
            name="purchasePrice"
            label={translate('Purchase price (your currency)')}
            type="number"
          />
          <Field
            name="description"
            label={translate('Notes')}
            type="textarea"
            placeholder={translate('What makes this lure special?')}
          />
        </>
      ) : (
        <>
          <Field
            name="weather"
            label={translate('Weather')}
            placeholder={translate('e.g. Overcast, light wind')}
          />
          <Field
            name="waterConditions"
            label={translate('Water conditions')}
            placeholder={translate('e.g. Clear water, 14°C')}
          />
          <Field
            name="notes"
            label={translate('Your story')}
            type="textarea"
            placeholder={translate('The spot, the retrieve, that moment on the line…')}
          />
        </>
      )}
    </div>
  );
}
