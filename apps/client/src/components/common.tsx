import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Fish, Plus, ArrowUpRight, UploadCloud, ImagePlus, X, AlertCircle } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { Lure, FishCatch } from '@lurelog/shared';
import { Button } from './ui/button';
import { dateLabel, lureOf } from '../lib/api';
export function LureArt({ type = '', className = '' }: { type?: string; className?: string }) {
  const soft = type === 'Soft Plastic' || type === 'Swimbait';
  return (
    <svg
      className={`lure-art ${className}`}
      viewBox="0 0 320 180"
      role="img"
      aria-label={`${type || 'Fishing'} lure illustration`}
    >
      <defs>
        <linearGradient id={soft ? 'soft' : 'fish'} x2=".2" y2="1">
          <stop stopColor={soft ? '#777b48' : '#6f9b84'} />
          <stop offset=".48" stopColor={soft ? '#afb179' : '#d2d9ab'} />
          <stop offset="1" stopColor="#f0debd" />
        </linearGradient>
      </defs>
      <ellipse cx="161" cy="148" rx="86" ry="7" fill="currentColor" opacity=".06" />
      <g transform="rotate(-14 160 85)">
        <path
          d="M65 91 Q85 48 158 62 Q211 66 238 84 L268 67 L263 109 L236 94 Q156 125 65 91Z"
          fill={`url(#${soft ? 'soft' : 'fish'})`}
          stroke="#426657"
          strokeWidth="1.5"
        />
        {Array.from({ length: 6 }, (_, i) => (
          <path
            key={i}
            d={`M${110 + i * 18} 65 q-12 14 -3 34`}
            fill="none"
            stroke="#315d49"
            strokeWidth="4"
            opacity=".55"
          />
        ))}
        <path d="M74 91 Q110 113 230 94" stroke="#f4e8c4" strokeWidth="6" fill="none" />
        <circle cx="91" cy="80" r="7" fill="#efbd57" />
        <circle cx="91" cy="80" r="3.5" fill="#172c25" />
        <path d="M62 87 L39 95 L52 109 L81 98" fill="#fff" fillOpacity=".45" stroke="#9bada7" />
        <path
          d="M125 108 v22 q0 18 -13 7 m13 -7 q0 18 13 7 M208 102 v23 q0 18 -13 7 m13 -7 q0 18 13 7"
          stroke="#5e6b68"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="62" cy="87" r="3" fill="none" stroke="#657771" />
      </g>
    </svg>
  );
}
export function Photo({ src, alt, type }: { src?: string; alt: string; type?: string }) {
  return src ? <img src={src} alt={alt} loading="lazy" /> : <LureArt type={type} />;
}
export function Loading() {
  return (
    <div className="skeleton-grid" aria-label="Loading" role="status">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="empty" role="alert">
      <AlertCircle />
      <h2>Something interrupted the trip.</h2>
      <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
      {retry && <Button onClick={retry}>Try again</Button>}
    </div>
  );
}
export function Empty({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Fish size={34} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {to && (
        <Button asChild>
          <Link to={to}>
            <Plus size={17} />
            {label}
          </Link>
        </Button>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function LureCard({ lure }: { lure: Lure }) {
  return (
    <article className="lure-card">
      <Link to={`/lures/${lure._id}`} className="lure-image">
        <Photo src={lure.image?.url} alt={lure.name} type={lure.type} />
        <span className="image-tag">{lure.type}</span>
        <span className="image-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="lure-body">
        <span className="brand">{lure.brand}</span>
        <Link to={`/lures/${lure._id}`}>
          <h3>{lure.name}</h3>
        </Link>
        <div className="spec-line">
          {lure.lengthMm} mm <span>•</span> {lure.color || lure.buoyancy || 'Ready for the water'}
        </div>
        <div className="card-bottom">
          <span>
            <Fish size={15} />
            <strong>{lure.catchCount ?? 0}</strong> catches
          </span>
          <Link className="text-action" to={`/lures/${lure._id}/catches/new`}>
            <Plus size={15} /> Log catch
          </Link>
        </div>
      </div>
    </article>
  );
}
export function CatchCard({ item, list = false }: { item: FishCatch; list?: boolean }) {
  const lure = lureOf(item);
  return (
    <article className={`catch-card ${list ? 'catch-row' : ''}`}>
      <Link className="catch-image" to={`/catches/${item._id}`}>
        {item.photo ? (
          <img src={item.photo.url} alt={item.species} loading="lazy" />
        ) : (
          <div className="fish-placeholder">
            <Fish size={54} />
            <span>A memory worth keeping</span>
          </div>
        )}
        <span className="image-tag">{dateLabel(item.caughtAt)}</span>
      </Link>
      <div className="catch-body">
        <span className="brand">{item.location || 'On the water'}</span>
        <Link to={`/catches/${item._id}`}>
          <h3>{item.species}</h3>
        </Link>
        <p className="catch-measure">
          {item.lengthCm ? `${item.lengthCm} cm` : 'Length unrecorded'}
          {item.weightKg ? ` · ${item.weightKg} kg` : ''}
        </p>
        {lure && (
          <Link className="lure-link" to={`/lures/${lure._id}`}>
            <Fish size={14} />
            {lure.brand} {lure.name}
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}
export function Pagination({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (n: number) => void;
}) {
  return pages > 1 ? (
    <div className="pagination">
      <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </Button>
      <span>
        Page {page} of {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Next
      </Button>
    </div>
  ) : null;
}
export function ConfirmDelete({
  onConfirm,
  kind,
  busy = false,
}: {
  onConfirm: () => void;
  kind: string;
  busy?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="destructive" disabled={busy}>
          Delete {kind}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog">
          <AlertDialog.Title>Delete this {kind}?</AlertDialog.Title>
          <AlertDialog.Description>
            {kind === 'lure'
              ? 'This permanently deletes the lure, all its catches, and their photos.'
              : 'This permanently deletes this catch and its photo.'}{' '}
            This cannot be undone.
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Keep it</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Yes, delete
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
export function ImageUpload({
  file,
  onChange,
  existing,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  existing?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function pick(next?: File) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.');
      return;
    }
    setError('');
    onChange(next);
  }
  return (
    <div>
      <div
        className="upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        {preview || existing ? (
          <img className="upload-preview" src={preview || existing} alt="Selected upload preview" />
        ) : (
          <UploadCloud size={30} />
        )}
        <strong>{file ? file.name : 'Give your story a photo'}</strong>
        <p>
          Drag an image here, or choose one below.
          <br />
          JPEG, PNG or WebP · up to 5 MB
        </p>
        <div className="upload-actions">
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>
            <ImagePlus size={16} />
            Choose photo
          </Button>
          <label className="btn btn-outline camera-label">
            Take photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {file && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onChange(null)}
              aria-label="Remove selected image"
            >
              <X size={18} />
            </Button>
          )}
        </div>
        <input
          ref={input}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
