import { useFormContext } from 'react-hook-form';
import { lureTypes, fishSpecies } from '@lurelog/shared';
import { Field } from '../../components/forms/Field';
import LurePicker from '../../components/lures/LurePicker';
export function RecordEssentials({ kind }: { kind: 'lure' | 'catch' }) {
  const isLure = kind === 'lure';
  const form = useFormContext();
  return (
    <div className="fields-grid">
      {isLure ? (
        <>
          <Field name="name" label="Model / name" required placeholder="e.g. Original Floater" />
          <Field name="brand" label="Brand" required placeholder="e.g. Rapala" />
          <Field name="type" label="Lure type" required>
            {lureTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Field>
          <Field name="lengthMm" label="Length (mm)" type="number" required placeholder="90" />
          <Field name="weightGrams" label="Weight (g)" type="number" placeholder="12" />
          <Field name="color" label="Color / pattern" placeholder="e.g. Firetiger" />
        </>
      ) : (
        <>
          <LurePicker />
          <div className="field">
            <label htmlFor="species">
              Fish species <span className="required">*</span>
              <input
                id="species"
                list="species-list"
                aria-required="true"
                aria-invalid={!!form.formState.errors.species}
                aria-describedby={form.formState.errors.species ? 'species-error' : undefined}
                placeholder="Select or enter a species"
                {...form.register('species')}
              />
              <datalist id="species-list">
                {fishSpecies.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {form.formState.errors.species && (
                <span id="species-error" role="alert" className="field-error">
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
  );
}
export function RecordAdditional({ kind }: { kind: 'lure' | 'catch' }) {
  const isLure = kind === 'lure';
  return (
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
          <Field name="purchasePrice" label="Purchase price (your currency)" type="number" />
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
  );
}
