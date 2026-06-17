import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import adminService from '../../services/adminService';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for stats & charts
  const [metrics, setMetrics] = useState(null);
  const [complaintAnalytics, setComplaintAnalytics] = useState(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState(null);
  const [resolutionTrends, setResolutionTrends] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mRes, cRes, fRes, rRes] = await Promise.all([
          adminService.getDashboardMetrics(),
          adminService.getComplaintAnalytics(),
          adminService.getFeedbackAnalytics(),
          adminService.getResolutionTrends(),
        ]);
        
        if (mRes.success) setMetrics(mRes.data);
        if (cRes.success) setComplaintAnalytics(cRes.data);
        if (fRes.success) setFeedbackAnalytics(fRes.data);
        if (rRes.success) setResolutionTrends(rRes.data);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Failed to fetch analytics datasets. Please verify your connection or admin privileges.');
        toast.error('Failed to load administrative analytics.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="py-5">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error || !metrics) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="glass-panel p-5">
            <h3 className="text-danger mb-3">Error Loading Analytics</h3>
            <p className="text-secondary">{error || 'Unable to retrieve dashboard metrics.'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-gradient px-4 mt-3"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </>
    );
  }

  // --- CHART CONFIGURATIONS ---

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc',
          font: {
            family: 'Inter',
            size: 11,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 11, 16, 0.95)',
        titleColor: '#fff',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 10
          },
          precision: 0
        }
      }
    }
  };

  // 1. Category Chart Data (Pie)
  const categoryLabels = complaintAnalytics?.categories?.map(c => c.category) || [];
  const categoryValues = complaintAnalytics?.categories?.map(c => c.count) || [];
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Tickets',
        data: categoryValues,
        backgroundColor: [
          'rgba(0, 242, 254, 0.6)',   // Neon Cyan
          'rgba(139, 92, 246, 0.6)',  // Violet
          'rgba(16, 185, 129, 0.6)',  // Emerald Green
          'rgba(245, 158, 11, 0.6)',  // Amber
          'rgba(239, 68, 68, 0.6)'    // Rose Red
        ],
        borderColor: [
          '#00f2fe',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 1.5,
      }
    ]
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f8fafc',
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      tooltip: commonOptions.plugins.tooltip
    }
  };

  // 2. Feedback Rating Chart Data (Bar)
  const feedbackDistribution = feedbackAnalytics?.distribution || [];
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedbackDistribution.forEach(item => {
    if (ratingCounts[item.rating] !== undefined) {
      ratingCounts[item.rating] = item.count;
    }
  });

  const feedbackChartData = {
    labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
    datasets: [
      {
        label: 'Reviews Count',
        data: [ratingCounts[1], ratingCounts[2], ratingCounts[3], ratingCounts[4], ratingCounts[5]],
        backgroundColor: 'rgba(139, 92, 246, 0.55)', // Violet translucent
        borderColor: '#8b5cf6', // Violet
        borderWidth: 1.5,
        borderRadius: 4
      }
    ]
  };

  // 3. Monthly Submission Trends Chart Data (Line)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = resolutionTrends?.trends || [];
  const trendsLabels = trendData.map(t => `${monthNames[t.month - 1]} ${t.year}`);
  const trendsCounts = trendData.map(t => t.count);

  const trendsChartData = {
    labels: trendsLabels.length > 0 ? trendsLabels : ['No Data'],
    datasets: [
      {
        label: 'Complaints Submitted',
        data: trendsCounts.length > 0 ? trendsCounts : [0],
        fill: true,
        backgroundColor: 'rgba(0, 242, 254, 0.1)',
        borderColor: '#00f2fe',
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#00f2fe',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#00f2fe',
        pointRadius: 4
      }
    ]
  };

  const compStats = metrics.complaints || {};
  const agentStats = metrics.agents || {};

  return (
    <>
      <Navbar />
      <div className="container py-5 animate-fade-in">
        {/* Header Title Section */}
        <div className="mb-5">
          <h1 className="text-white fw-bold m-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Analytics Dashboard
          </h1>
          <p className="text-secondary m-0">
            Real-time monitoring of complaint volumes, agent workloads, and citizen feedback
          </p>
        </div>

        {/* Global Overview Cards Row 1 */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-lg-3">
            <div className="glass-panel p-4 text-center">
              <span className="text-muted small fw-semibold d-block mb-1">TOTAL COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0" style={{ background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {compStats.total || 0}
              </h2>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="glass-panel p-4 text-center border-start border-warning border-3">
              <span className="text-warning small fw-semibold d-block mb-1">PENDING COMPLAINTS</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.pending || 0}
              </h2>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="glass-panel p-4 text-center border-start border-info border-3">
              <span className="text-info small fw-semibold d-block mb-1">IN PROGRESS</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.inProgress || 0}
              </h2>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="glass-panel p-4 text-center border-start border-success border-3">
              <span className="text-success small fw-semibold d-block mb-1">RESOLVED</span>
              <h2 className="text-white fw-bold m-0">
                {compStats.resolved || 0}
              </h2>
            </div>
          </div>
        </div>

        {/* Global Overview Cards Row 2 */}
        <div className="row g-4 mb-5">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="glass-panel p-4 text-center border-start border-violet border-3" style={{ borderColor: 'var(--accent-violet)', height: '100%' }}>
              <span className="small fw-semibold d-block mb-1" style={{ color: 'var(--accent-violet)' }}>TOTAL AGENTS</span>
              <h2 className="text-white fw-bold m-0">
                {agentStats.total || 0}
              </h2>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-8">
            <div className="glass-panel p-4 text-center border-start border-primary border-3" style={{ borderColor: 'var(--accent-primary)', height: '100%' }}>
              <span className="small fw-semibold d-block mb-1" style={{ color: 'var(--accent-primary)' }}>TOTAL REGISTERED CITIZENS</span>
              <h2 className="text-white fw-bold m-0">
                {metrics.totalCitizens || 0}
              </h2>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="row g-4 mb-5">
          {/* Monthly Trends */}
          <div className="col-12 col-lg-7">
            <div className="glass-panel p-4" style={{ height: '400px' }}>
              <h5 className="text-white mb-4 small fw-semibold uppercase tracking-wider">MONTHLY SUBMISSION TRENDS</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line data={trendsChartData} options={commonOptions} />
              </div>
            </div>
          </div>

          {/* Category Share */}
          <div className="col-12 col-lg-5">
            <div className="glass-panel p-4" style={{ height: '400px' }}>
              <h5 className="text-white mb-4 small fw-semibold uppercase tracking-wider">COMPLAINTS BY CATEGORY</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                {categoryValues.length > 0 ? (
                  <Pie data={categoryChartData} options={categoryChartOptions} />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100 text-secondary small">
                    No categorised tickets recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Rating */}
          <div className="col-12">
            <div className="glass-panel p-4" style={{ height: '380px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="text-white m-0 small fw-semibold uppercase tracking-wider">CITIZEN FEEDBACK RATING DISTRIBUTION</h5>
                {feedbackAnalytics?.average > 0 && (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-semibold">
                    Avg Rating: {feedbackAnalytics.average} ★
                  </span>
                )}
              </div>
              <div style={{ height: '260px', position: 'relative' }}>
                <Bar data={feedbackChartData} options={commonOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAnalytics;
