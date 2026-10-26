import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { PageHeading, Loading, Failure, Empty, CatchCard } from '../components/common';
import { StatsCards } from '../components/dashboard/StatsCards';
import { CatchActivity } from '../components/dashboard/CatchActivity';
import { SpeciesBreakdown } from '../components/dashboard/SpeciesBreakdown';
import { TopLures } from '../components/dashboard/TopLures';
export default function Dashboard() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['stats'], queryFn: api.stats });
  if (query.isLoading) return <Loading />;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const stats = query.data!;
  return (
    <>
      <PageHeading
        eyebrow="YOUR FISHING RECORD"
        title={`Welcome back, ${user?.name.split(' ')[0]}.`}
        description="A clear view of your tackle, your catches, and your time on the water."
      >
        <Button variant="outline" asChild>
          <Link to="/lures/new">
            <Plus size={18} />
            Add lure
          </Link>
        </Button>
        <Button asChild>
          <Link to="/catches/new">
            <Plus size={18} />
            Log a catch
          </Link>
        </Button>
      </PageHeading>
      <StatsCards stats={stats} />
      <div className="dashboard-charts">
        <CatchActivity stats={stats} />
        <SpeciesBreakdown stats={stats} />
      </div>
      <div className="dashboard-bottom">
        <section className="recent-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LATEST FIELD NOTES</span>
              <h2>Recent catches</h2>
            </div>
            <Link className="text-action" to="/catches">
              Open journal
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {stats.recentCatches.length ? (
            <div className="journal-list recent-list">
              {stats.recentCatches.map((item) => (
                <CatchCard
                  datePlacement="footer"
                  headingLevel={3}
                  key={item._id}
                  item={item}
                  list
                />
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
        <TopLures lures={stats.topLures} />
      </div>
    </>
  );
}
