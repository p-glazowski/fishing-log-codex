import { useId, useRef } from 'react';
import type { PhotoPosition } from '@lurelog/shared';
import { useTranslation, numberLabel } from '../../lib/i18n';
import { Button } from '../ui/button';

export const photoPositionStyle = (position: PhotoPosition) => `${position.x}% ${position.y}%`;
const clamp = (value: number) => Math.round(Math.max(0, Math.min(100, value)) * 100) / 100;
export function PhotoPositionEditor({
  src,
  value,
  onChange,
}: {
  src: string;
  value: PhotoPosition;
  onChange: (position: PhotoPosition) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    value: PhotoPosition;
    overflowX: number;
    overflowY: number;
  } | null>(null);
  return (
    <section className="photo-position-editor" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{t('Card preview')}</h3>
      <p id={`${id}-help`}>
        {t('Drag the photo to keep the person and fish visible, or use the sliders below.')}
      </p>
      <div
        className="photo-position-frame"
        aria-describedby={`${id}-help`}
        onPointerDown={(event) => {
          if (event.button !== 0 || !image.current?.naturalWidth) return;
          const frame = event.currentTarget.getBoundingClientRect();
          const scale = Math.max(
            frame.width / image.current.naturalWidth,
            frame.height / image.current.naturalHeight,
          );
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            value,
            overflowX: Math.max(0, image.current.naturalWidth * scale - frame.width),
            overflowY: Math.max(0, image.current.naturalHeight * scale - frame.height),
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || start.pointer !== event.pointerId) return;
          onChange({
            x:
              start.overflowX > 0
                ? clamp(start.value.x - ((event.clientX - start.x) / start.overflowX) * 100)
                : start.value.x,
            y:
              start.overflowY > 0
                ? clamp(start.value.y - ((event.clientY - start.y) / start.overflowY) * 100)
                : start.value.y,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <img
          ref={image}
          src={src}
          alt={t('Catch card preview')}
          draggable={false}
          style={{ objectPosition: photoPositionStyle(value) }}
        />
      </div>
      <div className="photo-position-secondary">
        <img
          src={src}
          alt={t('Catch thumbnail preview')}
          draggable={false}
          style={{ objectPosition: photoPositionStyle(value) }}
        />
        <span>
          {t('Recent catches')}
          <small>{t('Thumbnail preview')}</small>
        </span>
      </div>
      <div className="photo-position-controls">
        <label htmlFor={`${id}-horizontal`}>
          {t('Horizontal position')}
          <input
            id={`${id}-horizontal`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={value.x}
            onChange={(event) => onChange({ ...value, x: Number(event.target.value) })}
          />
        </label>
        <label htmlFor={`${id}-vertical`}>
          {t('Vertical position')}
          <input
            id={`${id}-vertical`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={value.y}
            onChange={(event) => onChange({ ...value, y: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="photo-position-footer">
        <span role="status">
          {t('Position')}: {numberLabel(value.x)}% / {numberLabel(value.y)}%
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ x: 50, y: 50 })}>
          {t('Center photo')}
        </Button>
      </div>
      <p className="photo-position-note">
        {t(
          'Only the preview changes. Your full photo is preserved. Check both people and fish stay inside the frame.',
        )}
      </p>
    </section>
  );
}
