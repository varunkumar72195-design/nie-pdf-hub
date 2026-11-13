
import { memo, useEffect, useState } from "react";
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

// --------------------------------------------------
// PDF.JS WORKER
// --------------------------------------------------

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// --------------------------------------------------
// ANALYTICS IDS
// --------------------------------------------------

function getVisitorId() {
  let id = localStorage.getItem("nie_visitor_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("nie_visitor_id", id);
  }

  return id;
}

function getSessionId() {
  let id = sessionStorage.getItem("nie_session_id");

  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("nie_session_id", id);
  }

  return id;
}

function getAnalyticsHeaders() {
  return {
    "X-Visitor-ID": getVisitorId(),
    "X-Session-ID": getSessionId(),
  };
}

// --------------------------------------------------
// LAZY PDF PAGE
// --------------------------------------------------

const LazyPDFPage = memo(function LazyPDFPage({
  pageNumber,
  width,
}) {
  const [shouldRender, setShouldRender] = useState(
    pageNumber === 1
  );

  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (shouldRender || !container) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px 0px",
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [container, shouldRender]);

  return (
    <div
      ref={setContainer}
      className="pdf-page-wrapper"
    >
      {shouldRender ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="pdf-page-placeholder">
              <LoaderCircle size={22} />
              <span>Rendering page {pageNumber}...</span>
            </div>
          }
        />
      ) : (
        <div
          className="pdf-page-placeholder"
          style={{
            minHeight: `${width * 1.414}px`,
          }}
        >
          <span>Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
});

// --------------------------------------------------
// MAIN PDF VIEWER
// --------------------------------------------------

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
    typeof window !== "undefined"
      ? window.innerWidth
      : 800
  );

  // ------------------------------------------------
  // RESPONSIVE WIDTH
  // ------------------------------------------------

  useEffect(() => {
    function updateWidth() {
      setContainerWidth(window.innerWidth);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // ------------------------------------------------
  // FETCH SIGNED PDF URL
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      try {
        setLoading(true);
        setError("");
        setPdfUrl("");
        setNumPages(0);

        const response = await API.get(
          `/materials/${materialId}/view`,
          {
            headers: getAnalyticsHeaders(),
          }
        );

        const signedUrl = response.data?.url;

        if (
          !signedUrl ||
          typeof signedUrl !== "string" ||
          !signedUrl.startsWith("https://")
        ) {
          throw new Error("Invalid signed PDF URL");
        }

        if (!cancelled) {
          setPdfUrl(signedUrl);
        }
      } catch (err) {
        console.error("PDF URL loading failed:", err);

        if (!cancelled) {
          setError(
            "Unable to load this PDF. Please try again."
          );
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
    };
  }, [materialId]);

  // ------------------------------------------------
  // PDF LOAD SUCCESS
  // ------------------------------------------------

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setError("");
  }

  // ------------------------------------------------
  // PDF LOAD ERROR
  // ------------------------------------------------

  function onDocumentLoadError(err) {
    console.error("PDF rendering failed:", err);

    setError(
      "Unable to display this PDF. Please try again."
    );
  }

  // ------------------------------------------------
  // DOWNLOAD PDF
  // ------------------------------------------------

  async function handleDownload() {
    try {
      setDownloading(true);

      const response = await API.get(
        `/materials/${materialId}/download`,
        {
          headers: getAnalyticsHeaders(),
        }
      );

      const signedUrl = response.data?.url;

      if (
        !signedUrl ||
        typeof signedUrl !== "string" ||
        !signedUrl.startsWith("https://")
      ) {
        throw new Error("Invalid download URL");
      }

      // Download directly from Supabase.
      const pdfResponse = await fetch(signedUrl);

      if (!pdfResponse.ok) {
        throw new Error("Supabase download failed");
      }

      const pdfBlob = await pdfResponse.blob();

      const downloadUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download =
        response.data.file_name ||
        `study-material-${materialId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 3000);

    } catch (err) {
      console.error("PDF download failed:", err);

      alert(
        "Unable to download this PDF. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  // ------------------------------------------------
  // PDF RESPONSIVE WIDTH
  // ------------------------------------------------

  const pdfWidth = Math.max(
    250,
    Math.min(containerWidth - 32, 900)
  );

  // ------------------------------------------------
  // UI
  // ------------------------------------------------

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

        {/* DOCUMENT HEADING */}

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

          {/* DOWNLOAD BUTTON */}

          <button
            type="button"
            onClick={handleDownload}
            disabled={
              downloading ||
              loading ||
              !!error
            }
            className="pdf-download-button"
          >

            {downloading ? (
              <LoaderCircle size={18} />
            ) : (
              <Download size={18} />
            )}

            {downloading
              ? "Downloading..."
              : "Download PDF"}

          </button>

        </div>

        {/* PDF VIEWER */}

        <div className="pdf-frame-container">

          {loading && (
            <div className="pdf-loading">

              <LoaderCircle size={30} />

              <p>Preparing PDF link...</p>

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
                file={{
                  url: pdfUrl,
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={{
                  disableAutoFetch: false,
                  rangeChunkSize: 65536,
                }}
                loading={
                  <div className="pdf-loading">

                    <LoaderCircle size={30} />

                    <p>Loading PDF pages...</p>

                  </div>
                }
                error={
                  <div className="pdf-error">
                    Unable to render this PDF.
                  </div>
                }
              >

                {Array.from(
                  { length: numPages },
                  (_, index) => (

                    <LazyPDFPage
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={pdfWidth}
                    />

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
