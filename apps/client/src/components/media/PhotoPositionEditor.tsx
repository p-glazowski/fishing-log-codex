import { useId, useRef, useState } from 'react';
import type { PhotoPosition } from '@lurelog/shared';
import { useTranslation, numberLabel } from '../../lib/i18n';
import { Button } from '../ui/button';

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
  const [dimensions, setDimensions] = useState({ src: '', width: 0, height: 0 });
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    value: PhotoPosition;
    overflowX: number;
    overflowY: number;
  } | null>(null);
  const ratio =
    dimensions.src === src && dimensions.height ? dimensions.width / dimensions.height : 0;
  const width = ratio > 1.5 ? 150 / ratio : 100;
  const height = ratio && ratio < 1.5 ? (ratio / 1.5) * 100 : 100;
  return (
    <div className="photo-position-editor">
      <p id={`${id}-help`}>{t('Drag the frame to choose what appears on catch cards.')}</p>
      <div
        className="photo-position-image"
        aria-describedby={`${id}-help`}
        onPointerDown={(event) => {
          if (event.button !== 0 || !ratio) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            value,
            overflowX: (bounds.width * (100 - width)) / 100,
            overflowY: (bounds.height * (100 - height)) / 100,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start || start.pointer !== event.pointerId) return;
          onChange({
            x: start.overflowX
              ? clamp(start.value.x + ((event.clientX - start.x) / start.overflowX) * 100)
              : start.value.x,
            y: start.overflowY
              ? clamp(start.value.y + ((event.clientY - start.y) / start.overflowY) * 100)
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
          className="upload-preview"
          src={src}
          alt={t('Selected upload preview')}
          draggable={false}
          onLoad={(event) =>
            setDimensions({
              src,
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
        />
        {ratio > 0 && (
          <span
            className="photo-position-mask"
            aria-hidden="true"
            style={{
              width: `${width}%`,
              height: `${height}%`,
              left: `${((100 - width) * value.x) / 100}%`,
              top: `${((100 - height) * value.y) / 100}%`,
            }}
          />
        )}
      </div>
      <details className="photo-position-controls">
        <summary>{t('Adjust with controls')}</summary>
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
        <div className="photo-position-footer">
          <span role="status">
            {t('Position')}: {numberLabel(value.x)}% / {numberLabel(value.y)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ x: 50, y: 50 })}
          >
            {t('Center photo')}
          </Button>
        </div>
      </details>
    </div>
  );
}
