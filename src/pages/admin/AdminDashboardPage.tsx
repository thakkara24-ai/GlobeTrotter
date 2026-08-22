import React, { useState, useEffect, useMemo } from 'react';
import { adminService, AdminStatsResponse } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { Input } from '../../components/common/Input';
import { formatCurrency } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  Map,
  MapPin,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Activity as ActivityIcon,
  Search,
  CheckCircle2,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#4F8A68', // Soft Green
  PLANNING: '#B8893D',  // Soft Amber
  COMPLETED: '#017E84', // Soft Teal
  CANCELLED: '#B85C5C', // Soft Red
};

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2F2930] text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-[#714B67] font-medium">
        <p className="font-bold text-[#F4EEF3]">{label || payload[0].name}</p>
        <p className="text-white font-extrabold">
          {payload[0].name ? `${payload[0].name}: ` : ''}
          {payload[0].value} {typeof payload[0].value === 'number' && payload[0].value > 10 ? 'pts' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredActivities = useMemo(() => {
    if (!stats) return [];
    return stats.topActivities.filter((act) => {
      const matchesSearch =
        act.name.toLowerCase().includes(activitySearch.toLowerCase()) ||
        (act.cityId?.name || '').toLowerCase().includes(activitySearch.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || act.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [stats, activitySearch, selectedCategory]);

  const categories = useMemo(() => {
    if (!stats) return [];
    const set = new Set(stats.topActivities.map((a) => a.category));
    return ['ALL', ...Array.from(set)];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-14 w-72 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Failed to load admin statistics'} onRetry={fetchStats} />
      </div>
    );
  }

  const summaryCards = [
    { label: 'Registered Users', value: stats.summary.totalUsers, icon: Users, accent: 'bg-[#F4EEF3] text-[#714B67] border-[#E5E1E4]' },
    { label: 'Total Trips', value: stats.summary.totalTrips, icon: Map, accent: 'bg-[#F4EEF3] text-[#714B67] border-[#E5E1E4]' },
    { label: 'Cities Catalog', value: stats.summary.totalCities, icon: MapPin, accent: 'bg-[#FCF7ED] text-[#B8893D] border-[#F3E3C7]' },
    { label: 'Activities Seeded', value: stats.summary.totalActivities, icon: Sparkles, accent: 'bg-[#EDF5F0] text-[#4F8A68] border-[#C6E2D1]' },
    { label: 'Community Stories', value: stats.summary.totalPosts, icon: MessageSquare, accent: 'bg-[#EAF5F5] text-[#017E84] border-[#B0DCDE]' },
  ];

  const topCitiesData = stats.topCities.map((c) => ({
    name: c.name,
    popularity: c.popularity,
  }));

  const statusPieData = stats.tripStatusCounts.map((s) => ({
    name: STATUS_LABELS[s._id] || s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#6F6A70',
  }));

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-[#E5E1E4] shadow-soft">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#714B67] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-display font-black text-[#2F2930] tracking-tight">Admin Console</h1>
                <Badge variant="primary" size="sm" className="font-bold">
                  Live Metrics
                </Badge>
              </div>
              <p className="text-xs text-[#6F6A70] mt-0.5 font-medium">Platform monitoring, adoption stats, and catalog analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDF5F0] text-[#4F8A68] border border-[#C6E2D1] text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#4F8A68]" /> System Healthy
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6F6A70] uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className={`p-2 rounded-xl border ${card.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cities bar chart */}
          <div className="bg-white rounded-2xl border border-[#E5E1E4] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#017E84]" />
                <h3 className="text-base font-bold text-[#2F2930] font-display">Top Cities by Popularity</h3>
              </div>
              <span className="text-xs font-semibold text-[#6F6A70]">Score 1-100</span>
            </div>

            {topCitiesData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#6F6A70] font-medium">
                No city data available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCitiesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6F6A70' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6F6A70' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="popularity" fill="#017E84" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* City ranking table */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E1E4] max-h-48 overflow-y-auto pr-1">
              {stats.topCities.map((city, idx) => (
                <div key={city._id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#F7F7F6] transition">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#F4EEF3] text-[#714B67] text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-6 h-6 rounded-md object-cover ring-1 ring-[#E5E1E4]"
                    />
                    <div>
                      <span className="font-bold text-[#2F2930]">{city.name}</span>
                      <span className="text-[#6F6A70] ml-1.5 font-medium">• {city.country}</span>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm" className="font-bold">
                    {city.popularity} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Status Donut chart */}
          <div className="bg-white rounded-2xl border border-[#E5E1E4] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-[#714B67]" />
                <h3 className="text-base font-bold text-[#2F2930] font-display">Trip Status Breakdown</h3>
              </div>
              <span className="text-xs font-semibold text-[#6F6A70]">
                {stats.summary.totalTrips} Total Trips
              </span>
            </div>

            {statusPieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#6F6A70] font-medium">
                No trip status data available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status counts breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E1E4]">
              {statusPieData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#F7F7F6] transition">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-bold text-[#2F2930]">{s.name}</span>
                  </div>
                  <span className="font-bold text-[#2F2930]">{s.value} trips</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Activities Catalog Table */}
        <div className="bg-white rounded-2xl border border-[#E5E1E4] p-6 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#2F2930] font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#714B67]" /> Catalog Activities & Experiences
              </h3>
              <p className="text-xs text-[#6F6A70] font-medium">Seeded experiences across all catalog cities</p>
            </div>

            {/* Search and Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-48 sm:w-60">
                <Input
                  placeholder="Search activity or city..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5 text-[#6F6A70]" />}
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#714B67] text-white shadow-xs'
                        : 'bg-[#F4EEF3] text-[#6F6A70] hover:bg-[#EAE1E8] hover:text-[#2F2930]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div className="overflow-x-auto border border-[#E5E1E4] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F6] border-b border-[#E5E1E4] text-[#6F6A70] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Activity Name</th>
                  <th className="p-3">Destination City</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Cost (INR)</th>
                  <th className="p-3 text-right">Popularity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1E4]">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#6F6A70] font-medium">
                      No activities match your search.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr key={act._id} className="hover:bg-[#F7F7F6] transition">
                      <td className="p-3 font-bold text-[#2F2930]">
                        <span className="truncate max-w-xs block">{act.name}</span>
                      </td>
                      <td className="p-3 font-medium text-[#2F2930]">
                        {act.cityId?.name || '—'}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" size="sm" className="capitalize">
                          {act.category}
                        </Badge>
                      </td>
                      <td className="p-3 font-bold text-[#2F2930]">
                        {formatCurrency(act.cost)}
                      </td>
                      <td className="p-3 text-right font-bold text-[#017E84]">
                        {act.popularity}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
