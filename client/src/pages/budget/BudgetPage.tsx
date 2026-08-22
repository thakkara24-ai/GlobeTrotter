import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import { budgetService } from '../../services/budgetService';
import { Trip, BudgetBreakdown } from '../../types';
import { TripHeaderTabs } from '../../components/trips/TripHeaderTabs';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  RefreshCw,
  Zap,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Transport: '#017E84',    // Teal
  'Stay / Hotel': '#714B67', // Purple
  Activities: '#5F7F9B',   // Slate
  Meals: '#B8893D',        // Warm Amber
  Other: '#6F6A70',        // Muted Gray
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2F2930] text-white p-2.5 rounded-xl shadow-lg text-xs space-y-0.5 border border-[#714B67] font-medium">
        <p className="font-bold text-[#F4EEF3]">{label || payload[0].name}</p>
        <p className="text-white font-extrabold">
          {formatCurrency(Number(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
};

export const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const fetchBudgetData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const [tripData, budgetData] = await Promise.all([
        tripService.getTripById(id),
        budgetService.getTripBudget(id),
      ]);
      setTrip(tripData.trip);
      setBudget(budgetData);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate budget');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [id]);

  const handleApplyRecommendation = async (rec: any) => {
    if (!id) return;
    setIsApplying(true);
    try {
      if (rec.type === 'SUBSTITUTION') {
        const updated = await budgetService.applyRecommendation(id, {
          action: 'SUBSTITUTE',
          targetItemId: rec.targetItemId,
          suggestedItemId: rec.suggestedItemId,
        });
        setBudget(updated);
        showToast('success', `Substituted activity! Saved ₹${rec.savingsAmount?.toLocaleString('en-IN')}`);
      } else if (rec.type === 'TRIM') {
        const updated = await budgetService.applyRecommendation(id, {
          action: 'REMOVE',
          targetItemId: rec.targetItemId,
        });
        setBudget(updated);
        showToast('success', 'Removed high cost item!');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to apply recommendation');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !trip || !budget) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Failed to load budget'} onRetry={fetchBudgetData} />
      </div>
    );
  }

  const chartData = budget.categoryBreakdown
    .filter((c) => c.amount > 0)
    .map((c) => ({
      name: c.category,
      value: c.amount,
      color: CATEGORY_COLORS[c.category] || '#6F6A70',
    }));

  const dailyChartData = budget.dailyBreakdown.map((d) => ({
    name: d.formattedDate,
    amount: d.total,
  }));

  const utilizationRate = trip.budget > 0 ? Math.round((budget.estimatedTotal / trip.budget) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F7F7F6] pb-16">
      {/* Header Tabs */}
      <TripHeaderTabs trip={trip} onTripUpdate={setTrip} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Planned Budget */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">
                Planned Budget
              </span>
              <div className="p-2 rounded-xl bg-[#F4EEF3] text-[#714B67] border border-[#E5E1E4]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">
              {formatCurrency(budget.totalBudget)}
            </p>
            <p className="text-xs text-[#6F6A70] mt-1 font-medium">Target limit for this trip</p>
          </div>

          {/* Current Estimate */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">
                Current Estimate
              </span>
              <div
                className={`p-2 rounded-xl border ${
                  budget.isOverBudget ? 'bg-[#F9EFEF] text-[#B85C5C] border-[#F0D1D1]' : 'bg-[#EAF5F5] text-[#017E84] border-[#B0DCDE]'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-2xl sm:text-3xl font-display font-black ${
                budget.isOverBudget ? 'text-[#B85C5C]' : 'text-[#2F2930]'
              }`}
            >
              {formatCurrency(budget.estimatedTotal)}
            </p>
            <p className="text-xs text-[#6F6A70] mt-1 font-medium">{utilizationRate}% of budget utilized</p>
          </div>

          {/* Remaining or Over */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">
                {budget.isOverBudget ? 'Over Budget' : 'Remaining Balance'}
              </span>
              <div
                className={`p-2 rounded-xl border ${
                  budget.isOverBudget ? 'bg-[#F9EFEF] text-[#B85C5C] border-[#F0D1D1]' : 'bg-[#EDF5F0] text-[#4F8A68] border-[#C6E2D1]'
                }`}
              >
                {budget.isOverBudget ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
            </div>
            <p
              className={`text-2xl sm:text-3xl font-display font-black ${
                budget.isOverBudget ? 'text-[#B85C5C]' : 'text-[#4F8A68]'
              }`}
            >
              {budget.isOverBudget ? `+${formatCurrency(budget.overBudget)}` : formatCurrency(budget.remaining)}
            </p>
            <p className="text-xs text-[#6F6A70] mt-1 font-medium">
              {budget.isOverBudget ? 'Exceeds target limit' : 'Available buffer'}
            </p>
          </div>

          {/* Avg Daily Cost */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E1E4] shadow-soft card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6F6A70] uppercase tracking-wider">
                Avg Daily Spend
              </span>
              <div className="p-2 rounded-xl bg-[#FCF7ED] text-[#B8893D] border border-[#F3E3C7]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-display font-black text-[#2F2930]">
              {formatCurrency(budget.averageDailyCost)}
            </p>
            <p className="text-xs text-[#6F6A70] mt-1 font-medium">
              Across {budget.tripDurationDays} {budget.tripDurationDays === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Budget Recommendations & Substitution Engine */}
        <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4EEF3] border border-[#E5E1E4] flex items-center justify-center text-[#714B67]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-[#2F2930] flex items-center gap-2">
                  Budget Insights & Optimization
                </h3>
                <p className="text-xs text-[#6F6A70] font-medium">
                  Automated expense analysis, high-cost alerts, and activity substitution suggestions
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchBudgetData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-[#714B67] hover:border-[#714B67]"
            >
              Re-analyze
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budget.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3.5 ${
                  rec.type === 'WARNING'
                    ? 'bg-[#F9EFEF] border-[#F0D1D1] text-[#B85C5C]'
                    : rec.type === 'SUBSTITUTION'
                    ? 'bg-[#FCF7ED] border-[#F3E3C7] text-[#B8893D]'
                    : rec.type === 'TRIM'
                    ? 'bg-[#FCF7ED] border-[#F3E3C7] text-[#B8893D]'
                    : 'bg-[#EDF5F0] border-[#C6E2D1] text-[#4F8A68]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {rec.type === 'WARNING' && <AlertTriangle className="w-4 h-4 shrink-0 text-[#B85C5C]" />}
                    {rec.type === 'SUBSTITUTION' && <Sparkles className="w-4 h-4 shrink-0 text-[#B8893D]" />}
                    {rec.type === 'TRIM' && <TrendingUp className="w-4 h-4 shrink-0 text-[#B8893D]" />}
                    {rec.type === 'TIP' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4F8A68]" />}
                    <h4 className="text-xs sm:text-sm font-bold leading-snug font-display text-[#2F2930]">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-[#6F6A70] leading-relaxed font-medium">{rec.description}</p>
                </div>

                {/* 1-Click Action for Substitution or Trim */}
                {(rec.type === 'SUBSTITUTION' || rec.type === 'TRIM') && rec.targetItemId && (
                  <Button
                    size="sm"
                    variant={rec.type === 'SUBSTITUTION' ? 'accent' : 'danger'}
                    className="w-full text-xs py-1.5 font-bold"
                    onClick={() => handleApplyRecommendation(rec)}
                    isLoading={isApplying}
                  >
                    {rec.type === 'SUBSTITUTION'
                      ? `Apply Substitution (Save ₹${rec.savingsAmount?.toLocaleString('en-IN')})`
                      : `Optimize / Trim Item`}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown (Pie Chart) */}
          <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#2F2930] font-display">Spending by Category</h3>
              <p className="text-xs text-[#6F6A70] font-medium">Distribution across Transport, Stays, Activities & Dining</p>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#6F6A70] font-medium">
                No categorized expenses added yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Table */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5E1E4]">
              {budget.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#F7F7F6] transition">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6F6A70' }}
                    />
                    <span className="font-bold text-[#2F2930]">{cat.category}</span>
                    <span className="text-[#6F6A70]">({cat.count} items)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#2F2930]">{formatCurrency(cat.amount)}</span>
                    <span className="text-[#6F6A70] font-semibold w-8 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Expense Burn Rate (Bar Chart) */}
          <div className="bg-white rounded-2xl border border-[#E5E1E4] p-5 sm:p-6 shadow-soft space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#2F2930] font-display">Daily Spending Burn Rate</h3>
              <p className="text-xs text-[#6F6A70] font-medium">Day-by-day expense timeline</p>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#6F6A70] font-medium">
                No daily itinerary items scheduled.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6F6A70' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6F6A70' }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="amount" fill="#714B67" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily Summary list */}
            <div className="space-y-1 pt-2 border-t border-[#E5E1E4] max-h-44 overflow-y-auto pr-1">
              {budget.dailyBreakdown.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-[#F7F7F6] transition">
                  <span className="font-bold text-[#2F2930]">{day.formattedDate}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6F6A70] font-medium">{day.items.length} items</span>
                    <span className="font-bold text-[#2F2930]">{formatCurrency(day.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
