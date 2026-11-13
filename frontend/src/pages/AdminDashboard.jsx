
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Building2,
  BookOpen,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Database,
  Files,
  Cloud,
  HardDrive,
  LogOut,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";

import API from "../services/api";
import "../styles/admin-dashboard.css";

// FORMAT FILE SIZE
function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );

  const value = size / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

// CONVERT FILE SIZE STRING INTO BYTES
function parseFileSize(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  const normalized = String(value).trim().replace(/,/g, "");
  const match = normalized.match(/^([\d.]+)\s*(bytes?|kb|mb|gb|tb)?$/i);

  if (!match) return 0;

  const amount = Number(match[1]);
  const unit = (match[2] || "bytes").toLowerCase();

  if (!Number.isFinite(amount) || amount < 0) return 0;

  const multipliers = {
    byte: 1,
    bytes: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  return amount * (multipliers[unit] || 1);
}

// FORMAT DATE
function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// FORMAT NUMBER
function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

// BUILD PDF URL
function getFileUrl(url) {
  if (!url) return "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const baseURL = (
    API.defaults.baseURL || "http://127.0.0.1:8000/api"
  ).replace(/\/+$/, "");

  if (url.startsWith("/api/") && baseURL.endsWith("/api")) {
    return `${baseURL.slice(0, -4)}${url}`;
  }

  if (url.startsWith("/")) {
    return `${baseURL}${url}`;
  }

  return `${baseURL}/${url}`;
}

// ERROR MESSAGE
function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

// ANALYTICS CARD
function AnalyticsCard({ icon: Icon, title, value, description }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-icon">
        <Icon size={23} />
      </div>

      <div className="analytics-stat-info">
        <p>{title}</p>
        <h2>{formatNumber(value)}</h2>
        <span>{description}</span>
      </div>
    </div>
  );
}

// ACTIVITY CHART
function ActivityChart({ activity }) {
  const maxValue = Math.max(
    1,
    ...activity.flatMap((item) => [
      Number(item.page_views || 0),
      Number(item.pdf_views || 0),
      Number(item.pdf_downloads || 0),
    ])
  );

  if (!activity.length) {
    return (
      <div className="analytics-empty">
        <Activity size={32} />
        <p>No activity recorded in the selected period.</p>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="analytics-chart-legend">
        <span>
          <i className="legend-page-views" />
          Page Views
        </span>

        <span>
          <i className="legend-pdf-views" />
          PDF Views
        </span>

        <span>
          <i className="legend-downloads" />
          Downloads
        </span>
      </div>

      <div className="analytics-chart">
        {activity.map((item) => {
          const pageViews = Number(item.page_views || 0);
          const pdfViews = Number(item.pdf_views || 0);
          const downloads = Number(item.pdf_downloads || 0);

          return (
            <div
              className="analytics-chart-day"
              key={item.date}
              title={`${item.date}
Page views: ${pageViews}
PDF views: ${pdfViews}
Downloads: ${downloads}`}
            >
              <div className="analytics-chart-bars">
                <div
                  className="analytics-bar page-views-bar"
                  style={{
                    height: `${(pageViews / maxValue) * 100}%`,
                  }}
                />

                <div
                  className="analytics-bar pdf-views-bar"
                  style={{
                    height: `${(pdfViews / maxValue) * 100}%`,
                  }}
                />

                <div
                  className="analytics-bar downloads-bar"
                  style={{
                    height: `${(downloads / maxValue) * 100}%`,
                  }}
                />
              </div>

              <span>
                {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                  "en-IN",
                  { day: "2-digit", month: "short" }
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// TOP PDF LIST
function TopPdfList({ items, type }) {
  if (!items.length) {
    return (
      <div className="analytics-empty">
        <FileText size={28} />
        <p>No PDF activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="top-pdf-list">
      {items.map((item, index) => (
        <div className="top-pdf-item" key={item.material_id}>
          <div className="top-pdf-rank">
            {index + 1}
          </div>

          <div className="top-pdf-info">
            <h4>{item.title || "Untitled PDF"}</h4>
            <p>{item.file_name || "Unknown file"}</p>
          </div>

          <div className="top-pdf-count">
            <strong>
              {formatNumber(
                type === "views" ? item.views : item.downloads
              )}
            </strong>

            <span>
              {type === "views" ? "Views" : "Downloads"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [storage, setStorage] = useState(null);

  // ANALYTICS STATES
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topViews, setTopViews] = useState([]);
  const [topDownloads, setTopDownloads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("token_type");
    sessionStorage.removeItem("expires_in");

    navigate("/manage-portal", { replace: true });
  };

  // HANDLE AUTH ERRORS
  const handleAuthError = (err) => {
    if (
      err?.response?.status === 401 ||
      err?.response?.status === 403
    ) {
      handleLogout();
      return true;
    }

    return false;
  };

  // FETCH DASHBOARD
  const fetchDashboard = async () => {
    try {
      setError("");

      const response = await API.get("/admin/dashboard", {
        requiresAuth: true,
      });

      setDashboard(response.data);
    } catch (err) {
      if (handleAuthError(err)) return;

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // FETCH STORAGE
  const fetchStorage = async () => {
    try {
      setStorageError("");

      const response = await API.get("/admin/storage", {
        requiresAuth: true,
      });

      setStorage(response.data);
    } catch (err) {
      if (handleAuthError(err)) return;

      setStorageError(getErrorMessage(err));
    } finally {
      setStorageLoading(false);
    }
  };

  // FETCH ANALYTICS
  const fetchAnalytics = async () => {
    try {
      setAnalyticsError("");

      const [
        summaryResponse,
        activityResponse,
        viewsResponse,
        downloadsResponse,
      ] = await Promise.all([
        API.get("/analytics/summary", {
          requiresAuth: true,
        }),

        API.get("/analytics/activity?days=30", {
          requiresAuth: true,
        }),

        API.get("/analytics/top-views", {
          requiresAuth: true,
        }),

        API.get("/analytics/top-downloads", {
          requiresAuth: true,
        }),
      ]);

      setAnalytics(summaryResponse.data);
      setActivity(activityResponse.data);
      setTopViews(viewsResponse.data);
      setTopDownloads(downloadsResponse.data);
    } catch (err) {
      if (handleAuthError(err)) return;

      setAnalyticsError(getErrorMessage(err));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // REFRESH ALL DASHBOARD DATA
  const refreshDashboard = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchDashboard(),
      fetchStorage(),
      fetchAnalytics(),
    ]);

    setRefreshing(false);
  };

  // INITIAL DATA FETCH
  useEffect(() => {
    fetchDashboard();
    fetchStorage();
    fetchAnalytics();
  }, []);

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="admin-loading">
        <RefreshCw className="loading-spinner" size={28} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // DASHBOARD ERROR
  if (error) {
    return (
      <div className="admin-loading admin-error-state">
        <FileText size={36} />
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>

        <div className="admin-error-actions">
          <button onClick={fetchDashboard}>
            <RefreshCw size={16} />
            Retry
          </button>

          <button onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD DATA
  const totalDepartments = dashboard?.total_departments ?? 0;
  const totalSubjects = dashboard?.total_subjects ?? 0;
  const totalMaterials = dashboard?.total_materials ?? 0;

  const recentUploads = dashboard?.recent_uploads ?? [];

  // DATABASE SIZE
  const databaseSize = storage?.database_size || "0 Bytes";

  const databaseBytes =
    Number(storage?.database_size_bytes) ||
    parseFileSize(databaseSize);

  // SUPABASE STORAGE
  const storageUsed =
    storage?.bucket_used ||
    storage?.uploads_size ||
    "0 Bytes";

  const bucketBytes =
    Number(
      storage?.bucket_used_bytes ??
      storage?.bucket_size_bytes ??
      storage?.supabase_storage_bytes
    ) || parseFileSize(storageUsed);

  const storageFileCount =
    storage?.bucket_file_count ??
    storage?.actual_pdf_files ??
    totalMaterials;

  // TOTAL APPLICATION STORAGE
  const totalStorageBytes = databaseBytes + bucketBytes;
  const totalStorage = formatFileSize(totalStorageBytes);

  // STORAGE CAPACITY
  const storageLimit = storage?.storage_limit;
  const storageLimitBytes = parseFileSize(storageLimit);

  const remainingStorage =
    storage?.remaining_storage_estimate ||
    (
      storageLimitBytes > 0
        ? formatFileSize(Math.max(0, storageLimitBytes - bucketBytes))
        : "Not provided"
    );

  const usagePercent = Math.min(
    100,
    Math.max(
      0,
      Number(storage?.usage_percent_estimate) ||
        (
          storageLimitBytes > 0
            ? (bucketBytes / storageLimitBytes) * 100
            : 0
        )
    )
  );

  // BACKEND SERVER DISK
  const diskTotal = storage?.disk_total || "—";
  const diskUsed = storage?.disk_used || "—";
  const diskFree = storage?.disk_free || "—";

  return (
    <div className="admin-dashboard">

      {/* DASHBOARD STATISTICS */}

      <section className="admin-stats">

        <div className="admin-stat-card">
          <div className="admin-stat-icon departments-icon">
            <Building2 size={24} />
          </div>

          <div className="admin-stat-info">
            <p>Total Departments</p>
            <h2>{totalDepartments}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon subjects-icon">
            <BookOpen size={24} />
          </div>

          <div className="admin-stat-info">
            <p>Total Subjects</p>
            <h2>{totalSubjects}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon materials-icon">
            <FileText size={24} />
          </div>

          <div className="admin-stat-info">
            <p>Total PDF Materials</p>
            <h2>{totalMaterials}</h2>
          </div>
        </div>

      </section>

      {/* ANALYTICS OVERVIEW */}

      <section className="analytics-section">

        <div className="analytics-section-header">
          <div>
            <h2>Website Analytics</h2>
            <p>Monitor student visits and PDF engagement</p>
          </div>

          <button
            className="storage-refresh-btn"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "loading-spinner" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>

        {analyticsLoading ? (
          <div className="storage-loading">
            <RefreshCw size={20} className="loading-spinner" />
            <span>Loading analytics...</span>
          </div>
        ) : analyticsError ? (
          <div className="storage-error">
            <p>{analyticsError}</p>

            <button onClick={fetchAnalytics}>
              <RefreshCw size={15} />
              Retry Analytics
            </button>
          </div>
        ) : (
          <>
            {/* ANALYTICS CARDS */}

            <div className="analytics-stats-grid">

              <AnalyticsCard
                icon={TrendingUp}
                title="Total Visits"
                value={analytics?.total_visits}
                description="Recorded page visits"
              />

              <AnalyticsCard
                icon={Users}
                title="Unique Visitors"
                value={analytics?.unique_visitors}
                description="Distinct visitor IDs"
              />

              <AnalyticsCard
                icon={Eye}
                title="PDF Views"
                value={analytics?.pdf_views}
                description="Total PDF views"
              />

              <AnalyticsCard
                icon={Download}
                title="PDF Downloads"
                value={analytics?.pdf_downloads}
                description="Total PDF downloads"
              />

            </div>

            {/* ACTIVITY CHART */}

            <div className="analytics-panel">

              <div className="analytics-panel-header">
                <div>
                  <h3>
                    <Activity size={19} />
                    Website Activity
                  </h3>

                  <p>Daily activity during the last 30 days</p>
                </div>
              </div>

              <ActivityChart activity={activity} />

            </div>

            {/* TOP PDF TABLES */}

            <div className="analytics-top-grid">

              <div className="analytics-panel">

                <div className="analytics-panel-header">
                  <div>
                    <h3>
                      <Eye size={19} />
                      Most Viewed PDFs
                    </h3>

                    <p>Top 5 popular study materials</p>
                  </div>
                </div>

                <TopPdfList
                  items={topViews}
                  type="views"
                />

              </div>

              <div className="analytics-panel">

                <div className="analytics-panel-header">
                  <div>
                    <h3>
                      <Download size={19} />
                      Most Downloaded PDFs
                    </h3>

                    <p>Top 5 downloaded study materials</p>
                  </div>
                </div>

                <TopPdfList
                  items={topDownloads}
                  type="downloads"
                />

              </div>

            </div>
          </>
        )}

      </section>

      {/* STORAGE OVERVIEW */}

      <section className="storage-section">

        <div className="storage-section-header">
          <div>
            <h2>Storage Overview</h2>
            <p>Monitor your database and PDF storage usage</p>
          </div>

          <button
            className="storage-refresh-btn"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "loading-spinner" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {storageLoading ? (
          <div className="storage-loading">
            <RefreshCw size={20} className="loading-spinner" />
            <span>Loading storage information...</span>
          </div>
        ) : storageError ? (
          <div className="storage-error">
            <p>{storageError}</p>

            <button onClick={fetchStorage}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* STORAGE CARDS */}

            <div className="storage-cards">

              <div className="storage-card">
                <div className="storage-card-icon database-icon">
                  <Database size={22} />
                </div>

                <div>
                  <p>PostgreSQL Database</p>
                  <h3>{databaseSize}</h3>
                  <span>Database size</span>
                </div>
              </div>

              <div className="storage-card">
                <div className="storage-card-icon files-icon">
                  <Files size={22} />
                </div>

                <div>
                  <p>Total PDF Materials</p>
                  <h3>{storageFileCount}</h3>
                  <span>Stored PDF files</span>
                </div>
              </div>

              <div className="storage-card">
                <div className="storage-card-icon cloud-icon">
                  <Cloud size={22} />
                </div>

                <div>
                  <p>Supabase Storage Used</p>
                  <h3>{storageUsed}</h3>
                  <span>PDF file storage</span>
                </div>
              </div>

              <div className="storage-card">
                <div className="storage-card-icon harddrive-icon">
                  <HardDrive size={22} />
                </div>

                <div>
                  <p>Total Application Storage</p>
                  <h3>{totalStorage}</h3>
                  <span>Database + Supabase PDFs</span>
                </div>
              </div>

            </div>

            {/* STORAGE CAPACITY */}

            {(storageLimit || storageLimitBytes > 0) && (
              <div className="storage-capacity-card">

                <div className="storage-capacity-header">
                  <div>
                    <h3>Storage Capacity</h3>
                    <p>Estimated bucket usage</p>
                  </div>

                  <strong>{usagePercent.toFixed(1)}% Used</strong>
                </div>

                <div className="storage-progress-track">
                  <div
                    className="storage-progress-fill"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <div className="storage-capacity-details">
                  <span>Used: {storageUsed}</span>

                  <span>
                    Limit: {storageLimit || "Not provided"}
                  </span>

                  <span>
                    Remaining: {remainingStorage}
                  </span>
                </div>

                <p className="storage-capacity-note">
                  Storage figures are estimates based on the configured
                  bucket limit. They may not represent total
                  organization-wide Supabase usage.
                </p>

              </div>
            )}

            {/* BACKEND SERVER DISK INFORMATION */}

            {(storage?.disk_total || storage?.disk_used) && (
              <div className="storage-disk-info">
                <h3>Backend Server Disk Information</h3>

                <div className="storage-disk-grid">

                  <div>
                    <span>Total Disk</span>
                    <strong>{diskTotal}</strong>
                  </div>

                  <div>
                    <span>Used Disk</span>
                    <strong>{diskUsed}</strong>
                  </div>

                  <div>
                    <span>Free Disk</span>
                    <strong>{diskFree}</strong>
                  </div>

                  <div>
                    <span>Disk Usage</span>
                    <strong>
                      {storage?.disk_usage_percent ?? 0}%
                    </strong>
                  </div>

                </div>
              </div>
            )}

            {/* STORAGE SUMMARY */}

            <div className="storage-summary">
              <span>Database: {databaseSize}</span>
              <span>Supabase PDFs: {storageUsed}</span>
              <span>Total: {totalStorage}</span>
            </div>

          </>
        )}

      </section>

      {/* RECENT PDF UPLOADS */}

      <section className="admin-recent-section">

        <div className="admin-section-header">
          <div>
            <h2>Recent PDF Uploads</h2>
            <p>Recently added study materials</p>
          </div>
        </div>

        {recentUploads.length === 0 ? (
          <div className="admin-empty-state">
            <FileText size={36} />
            <h3>No PDF materials found</h3>
            <p>Uploaded materials will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">

              <thead>
                <tr>
                  <th>PDF Title</th>
                  <th>File Name</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {recentUploads.map((material) => (
                  <tr key={material.id}>

                    <td>
                      <div className="recent-file-title">
                        <FileText size={18} />

                        <span>
                          {material.title || "Untitled PDF"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {material.file_name || "—"}
                    </td>

                    <td>
                      {formatFileSize(material.file_size)}
                    </td>

                    <td>
                      {formatDate(material.uploaded_at)}
                    </td>

                    <td>
                      <div className="recent-file-actions">

                        {material.view_url && (
                          <a
                            href={getFileUrl(material.view_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="recent-view-btn"
                            title="View PDF"
                          >
                            <Eye size={17} />
                            View
                          </a>
                        )}

                        {material.download_url && (
                          <a
                            href={getFileUrl(material.download_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="recent-download-btn"
                            title="Download PDF"
                          >
                            <Download size={17} />
                            Download
                          </a>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </section>

    </div>
  );
}

export default AdminDashboard;
