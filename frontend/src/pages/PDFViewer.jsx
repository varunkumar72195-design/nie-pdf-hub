
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { Document, Page, pdfjs } from "react-pdf";

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
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Configure PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Visitor ID
function getVisitorId() {
  let visitorId = localStorage.getItem("nie_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("nie_visitor_id", visitorId);
  }

  return visitorId;
}

// Session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem("nie_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("nie_session_id", sessionId);
  }

  return sessionId;
}

// Analytics headers
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

  const [numPages, setNumPages] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 800
  );

  // Responsive width
  useEffect(() => {
    function updateWidth() {
      setContainerWidth(window.innerWidth);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Fetch PDF and record view analytics.
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function loadPDF() {
      try {
        setLoading(true);
        setError("");
        setPdfUrl("");
        setNumPages(0);

        const response = await API.get(
          `/materials/${materialId}/view`,
          {
            responseType: "blob",
            headers: getAnalyticsHeaders(),
          }
        );

        if (
          !response.data ||
          response.data.size === 0 ||
          response.data.type !== "application/pdf"
        ) {
          throw new Error("Invalid PDF response");
        }

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

  // PDF loaded successfully.
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setError("");
  }

  // PDF rendering error.
  function onDocumentLoadError(err) {
    console.error("PDF rendering failed:", err);
    setError("Unable to display this PDF. Please try again.");
  }

  // Download PDF and record download analytics.
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
      }, 2000);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Unable to download this PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const pdfWidth = Math.max(
    250,
    Math.min(containerWidth - 32, 900)
  );

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
              <p>
                {numPages > 0
                  ? `${numPages} PDF Pages`
                  : "PDF Document"}
              </p>
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
            <div className="pdf-pages-container">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="pdf-loading">
                    <LoaderCircle size={30} />
                    <p>Rendering PDF...</p>
                  </div>
                }
                error={
                  <div className="pdf-error">
                    Unable to render this PDF.
                  </div>
                }
              >
                {Array.from(
                  new Array(numPages),
                  (_, index) => (
                    <div
                      className="pdf-page-wrapper"
                      key={`page_${index + 1}`}
                    >
                      <Page
                        pageNumber={index + 1}
                        width={pdfWidth}
                        renderTextLayer
                        renderAnnotationLayer
                      />
                    </div>
                  )
                )}
              </Document>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PDFViewer;
