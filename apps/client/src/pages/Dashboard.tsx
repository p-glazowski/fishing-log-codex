import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Fish,
  BookOpen,
  Shapes,
  Trophy,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sunrise,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { PageHeading, Loading, Failure, Empty, CatchCard, Photo } from '../components/common';
const colors = ['#376653', '#91ae86', '#cfba84', '#8baba9', '#c2c9bb', '#8c9d74'];
export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('year');
  const query = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  if (query.isLoading) return <Loading />;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const stats = query.data!;
  const now = new Date();
  const year = now.getUTCFullYear();
  const chart = Array.from({ length: period === 'year' ? 12 : 24 }, (_, i) => {
    const date = new Date(Date.UTC(year - (period === 'year' ? 0 : 1), i, 1));
    const month = date.toISOString().slice(0, 7);
    return {
      month: date.toLocaleDateString(undefined, {
        month: 'short',
        ...(period === 'year' ? {} : { year: '2-digit' }),
        timeZone: 'UTC',
      }),
      count: stats.activity.find((a) => a.month === month)?.count ?? 0,
    };
  });
  return (
    <>
      <PageHeading
        eyebrow="A GOOD DAY TO GET OUTSIDE"
        title={`Welcome back, ${user?.name.split(' ')[0]}.`}
        description="A little perspective on your days by the water."
      >
        <Button variant="outline" asChild>
          <Link to="/lures/new">
            <Plus size={17} />
            Add lure
          </Link>
        </Button>
        <Button asChild>
          <Link to="/catches/new">
            <Plus size={17} />
            Log a catch
          </Link>
        </Button>
      </PageHeading>
      <div className="dashboard-banner">
        <div>
          <span className="eyebrow">
            <Sunrise size={17} /> YOUR NEXT ADVENTURE AWAITS
          </span>
          <h2>Every cast is a new possibility.</h2>
          <p>Your tackle is ready. Your story is still being written.</p>
          <Link to="/lures">
            Explore your collection <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-landscape">
          <span />
          <i />
          <b />
        </div>
      </div>
      <div className="stats-grid">
        {[
          [Fish, 'Lures in your collection', stats.totalLures, 'A possibility in every pocket'],
          [BookOpen, 'Catches recorded', stats.totalCatches, 'Memories worth keeping'],
          [Shapes, 'Species caught', stats.uniqueSpecies, 'A little variety on the line'],
          [
            Trophy,
            'Most successful lure',
            stats.topLures[0]?.name ?? 'Still to be discovered',
            stats.topLures[0]
              ? `${stats.topLures[0].catchCount} recorded catches`
              : 'Your next catch starts here',
          ],
        ].map(([Icon, label, value, note]) => {
          const I = Icon as typeof Fish;
          return (
            <div className="stat-card" key={String(label)}>
              <div>
                <span>{String(label)}</span>
                <I size={19} />
              </div>
              <strong className={typeof value === 'string' ? 'stat-text' : ''}>
                {String(value)}
              </strong>
              <small>{String(note)}</small>
            </div>
          );
        })}
      </div>
      <div className="dashboard-charts">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Days well spent</h2>
              <p>Your catch activity over time</p>
            </div>
            <select
              aria-label="Chart period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="year">This year</option>
              <option value="two">Last 2 calendar years</option>
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: -25, right: 12, top: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#567e62" stopOpacity={0.3} />
                    <stop offset="1" stopColor="#567e62" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  minTickGap={20}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Catches"
                  stroke="#567e62"
                  strokeWidth={2.5}
                  fill="url(#areaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!stats.totalCatches && (
            <p className="chart-empty-note">Your first catch will bring this chart to life.</p>
          )}
        </section>
        <section className="panel species-panel">
          <div className="panel-heading">
            <div>
              <h2>On the other end of the line</h2>
              <p>Your species breakdown</p>
            </div>
          </div>
          {stats.species.length ? (
            <>
              <div className="donut-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.species}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={57}
                      outerRadius={79}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {stats.species.map((s, i) => (
                        <Cell key={s.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-label">
                  <strong>{stats.uniqueSpecies}</strong>
                  <small>species</small>
                </div>
              </div>
              <div className="species-legend">
                {stats.species.map((s, i) => (
                  <div key={s.name}>
                    <i style={{ background: colors[i % colors.length] }} />
                    <span>{s.name}</span>
                    <strong>{s.count}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="small-empty">
              <Fish size={36} />
              <p>
                A world of fish to discover.
                <br />
                Start with your first catch.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="recent-section">
        <div className="section-heading">
          <div>
            <h2>Fresh from the water</h2>
            <p>Your most recent fishing memories</p>
          </div>
          <Link className="text-action" to="/catches">
            Open journal <ArrowUpRight size={17} />
          </Link>
        </div>
        {stats.recentCatches.length ? (
          <div className="catch-grid recent-grid">
            {stats.recentCatches.map((c) => (
              <CatchCard key={c._id} item={c} />
            ))}
          </div>
        ) : (
          <Empty
            title="Make your first memory."
            description="Log a catch and see your fishing story unfold here."
            to="/catches/new"
            label="Log a catch"
          />
        )}
      </section>
      <section className="panel top-lures">
        <div className="panel-heading">
          <div>
            <h2>The ones that deliver</h2>
            <p>Your top performing lures</p>
          </div>
          <Link to="/lures?sort=catches" className="text-action">
            View collection <ArrowUpRight size={16} />
          </Link>
        </div>
        {stats.topLures.length ? (
          <div className="ranking-list">
            {stats.topLures.map((l, i) => (
              <Link to={`/lures/${l._id}`} key={l._id}>
                <span className="rank">0{i + 1}</span>
                <div className="rank-image">
                  <Photo src={l.image?.url} alt={l.name} type={l.type} />
                </div>
                <div>
                  <span className="brand">{l.brand}</span>
                  <h3>{l.name}</h3>
                </div>
                <span className="rank-type">
                  {l.type} · {l.lengthMm} mm
                </span>
                <strong>
                  <Fish size={16} />
                  {l.catchCount} catches
                </strong>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            Your most successful lures will appear here as you record catches.
          </div>
        )}
      </section>
    </>
  );
}
