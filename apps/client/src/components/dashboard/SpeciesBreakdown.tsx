import { t, numberLabel, speciesLabel, useTranslation } from '../../lib/i18n';
import { Fish } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Stats } from '@lurelog/shared';
export function SpeciesBreakdown({ stats }: { stats: Stats }) {
  useTranslation();

  return (
    <section className="panel species-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t("WHAT'S ON YOUR LINE")}</span>
          <h2>{t('Species breakdown')}</h2>
          <p>{t('Your all-time catches by species')}</p>
        </div>
      </div>
      {stats.species.length ? (
        <>
          <div className="donut-container" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={stats.species.map((species) => ({
                    ...species,
                    name: speciesLabel(species.name),
                  }))}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="none"
                >
                  {stats.species.map((species, index) => (
                    <Cell key={speciesLabel(species.name)} fill={`var(--chart-${index % 5})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <strong>{numberLabel(stats.uniqueSpecies)}</strong>
              <small>{t('species')}</small>
            </div>
          </div>
          <ul className="species-legend">
            {stats.species.map((species, index) => (
              <li key={speciesLabel(species.name)}>
                <i className={`chart-swatch-${index % 5}`} aria-hidden="true" />
                <span>{speciesLabel(species.name)}</span>
                <strong>{numberLabel(species.count)}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="small-empty">
          <Fish size={32} />
          <p>
            {t('Your species record starts')}
            <br />
            {t('with your first catch.')}
          </p>
        </div>
      )}
    </section>
  );
}
