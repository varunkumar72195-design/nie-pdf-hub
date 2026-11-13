
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import {
  ArrowLeft,
  Download,
  FileText,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";
import "../styles/pdf-viewer.css";

// Generate or retrieve the same visitor ID used by PageViewTracker.
function getVisitorId() {
  let visitorId = localStorage.getItem("nie_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("nie_visitor_id", visitorId);
  }

  return visitorId;
}

// Generate or retrieve the same session ID used by PageViewTracker.
function getSessionId() {
  let sessionId = sessionStorage.getItem("nie_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("nie_session_id", sessionId);
  }

  return sessionId;
}

// Headers required by the existing backend analytics helper.
function getAnalyticsHeaders() {
  return {
    "X-Visitor-ID": getVisitorId(),
    "X-Session-ID": getSessionId(),
  };
}

function PDFViewer() {
  const {
    departmentId,
    yearId,
    semesterId,
    subjectId,
    materialId,
  } = useParams();

  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Load PDF and record its view.
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function loadPDF() {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/materials/${materialId}/view`,
          {
            responseType: "blob",
            headers: getAnalyticsHeaders(),
          }
        );

        objectUrl = URL.createObjectURL(response.data);

        if (!cancelled) {
          setPdfUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        console.error("PDF loading failed:", err);

        if (!cancelled) {
          setError("Unable to load this PDF. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPDF();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [materialId]);

  // Download PDF and record its download event.
  async function handleDownload() {
    try {
      setDownloading(true);

      const response = await API.get(
        `/materials/${materialId}/download`,
        {
          responseType: "blob",
          headers: getAnalyticsHeaders(),
        }
      );

      const downloadObjectUrl = URL.createObjectURL(
        response.data
      );

      const link = document.createElement("a");

      link.href = downloadObjectUrl;
      link.download = `study-material-${materialId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(downloadObjectUrl);
      }, 1000);

    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Unable to download this PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="pdf-viewer-page">

      <StudentNavbar />

      <header className="pdf-viewer-header">
        <Link
          to={`/departments/${departmentId}/years/${yearId}/semesters/${semesterId}/subjects/${subjectId}/materials`}
          className="pdf-back-link"
        >
          <ArrowLeft size={18} />
          Back to Materials
        </Link>
      </header>

      <main className="pdf-viewer-container">

        <div className="pdf-document-heading">

          <div className="pdf-document-info">
            <FileText size={25} />

            <div>
              <h2>Study Material</h2>
              <p>PDF Document</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loading || !!error}
            className="pdf-download-button"
          >
            {downloading ? (
              <LoaderCircle size={18} />
            ) : (
              <Download size={18} />
            )}

            {downloading ? "Downloading..." : "Download PDF"}
          </button>

        </div>

        <div className="pdf-frame-container">

          {loading && (
            <div className="pdf-loading">
              <LoaderCircle size={30} />
              <p>Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <AlertCircle size={25} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              title="Study Material PDF"
              className="pdf-frame"
            />
          )}

        </div>

      </main>

    </div>
  );
}

export default PDFViewer;
