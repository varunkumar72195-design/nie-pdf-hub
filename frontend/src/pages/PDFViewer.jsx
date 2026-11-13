
import { memo, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { Document, Page, pdfjs } from "react-pdf";

import {
  ArrowLeft,
  Download,
  FileText,
  LoaderCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  File,
  Expand,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";

import "../styles/pdf-viewer.css";

// PDF.JS WORKER
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ANALYTICS IDS
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

// FORMAT FILE SIZE
function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || bytes === "") {
    return "Size unavailable";
  }

  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "Size unavailable";
  }

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

// LAZY PDF PAGE
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
      id={`pdf-page-${pageNumber}`}
      ref={setContainer}
      className="pdf-page-wrapper"
      data-page-number={pageNumber}
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

// MAIN PDF VIEWER
function PDFViewer() {
  const {
    departmentId,
    yearId,
    semesterId,
    subjectId,
    materialId,
  } = useParams();

  const viewerRef = useRef(null);

  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("Study Material.pdf");
  const [fileSize, setFileSize] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [containerWidth, setContainerWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 800
  );

  // RESPONSIVE WIDTH
  useEffect(() => {
    function updateWidth() {
      setContainerWidth(window.innerWidth);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // FULLSCREEN STATE
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        document.fullscreenElement === viewerRef.current
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  // FETCH SIGNED PDF URL AND FILE DETAILS
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      try {
        setLoading(true);
        setError("");
        setPdfUrl("");
        setNumPages(0);
        setCurrentPage(1);
        setZoom(1);

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

          setFileName(
            response.data?.file_name ||
            response.data?.filename ||
            "Study Material.pdf"
          );

          setFileSize(
            response.data?.file_size ??
            response.data?.size ??
            null
          );
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

  // PDF LOAD SUCCESS
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setCurrentPage(1);
    setError("");
  }

  // PDF LOAD ERROR
  function onDocumentLoadError(err) {
    console.error("PDF rendering failed:", err);

    setError(
      "Unable to display this PDF. Please try again."
    );
  }

  // TRACK VISIBLE PAGE WHILE SCROLLING
  useEffect(() => {
    if (!numPages) return;

    const pageElements = document.querySelectorAll(
      ".pdf-page-wrapper[data-page-number]"
    );

    if (!pageElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePages = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top -
              b.boundingClientRect.top
          );

        if (visiblePages.length) {
          const pageNumber = Number(
            visiblePages[0].target.dataset.pageNumber
          );

          if (pageNumber) {
            setCurrentPage(pageNumber);
          }
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
      }
    );

    pageElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [numPages, pdfUrl]);

  // PAGE NAVIGATION
  function goToPage(page) {
    const targetPage = Math.max(
      1,
      Math.min(numPages, Number(page) || 1)
    );

    setCurrentPage(targetPage);

    document
      .getElementById(`pdf-page-${targetPage}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // ZOOM CONTROLS
  function zoomIn() {
    setZoom((previous) =>
      Math.min(2, Number((previous + 0.1).toFixed(1)))
    );
  }

  function zoomOut() {
    setZoom((previous) =>
      Math.max(0.5, Number((previous - 0.1).toFixed(1)))
    );
  }

  function resetZoom() {
    setZoom(1);
  }

  function fitToWidth() {
    setZoom(1);
  }

  // FULLSCREEN
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await viewerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  }

  // DOWNLOAD PDF
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

      const pdfResponse = await fetch(signedUrl);

      if (!pdfResponse.ok) {
        throw new Error("Supabase download failed");
      }

      const pdfBlob = await pdfResponse.blob();
      const downloadUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download =
        response.data?.file_name ||
        fileName ||
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

  // PDF RESPONSIVE WIDTH
  const basePdfWidth = Math.max(
    250,
    Math.min(containerWidth - 64, 900)
  );

  const pdfWidth = Math.round(basePdfWidth * zoom);

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

      <main
        ref={viewerRef}
        className={`pdf-viewer-container ${
          isFullscreen ? "pdf-viewer-fullscreen" : ""
        }`}
      >
        {/* DOCUMENT HEADING */}
        <div className="pdf-document-heading">
          <div className="pdf-document-info">
            <FileText size={25} />

            <div className="pdf-document-title">
              <h2 title={fileName}>{fileName}</h2>

              <p>
                PDF Document
                {numPages > 0 && ` · ${numPages} Pages`}
                {fileSize !== null &&
                  ` · ${formatFileSize(fileSize)}`}
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
              <LoaderCircle size={18} className="pdf-spin" />
            ) : (
              <Download size={18} />
            )}

            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>

        {/* PDF TOOLBAR */}
        {!loading && !error && pdfUrl && (
          <div className="pdf-toolbar">
            <div className="pdf-toolbar-group">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                title="Zoom out"
                className="pdf-tool-button"
              >
                <Minus size={18} />
              </button>

              <span className="pdf-zoom-value">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 2}
                title="Zoom in"
                className="pdf-tool-button"
              >
                <Plus size={18} />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                title="Reset zoom"
                className="pdf-tool-button"
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                onClick={fitToWidth}
                title="Fit to width"
                className="pdf-tool-button pdf-fit-button"
              >
                <Expand size={16} />
                <span>Fit width</span>
              </button>
            </div>

            <div className="pdf-toolbar-group pdf-page-navigation">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                title="Previous page"
                className="pdf-tool-button"
              >
                <ChevronLeft size={19} />
              </button>

              <span className="pdf-page-count">
                {currentPage} / {numPages}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                title="Next page"
                className="pdf-tool-button"
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
              className="pdf-tool-button pdf-fullscreen-button"
            >
              {isFullscreen ? (
                <Minimize2 size={18} />
              ) : (
                <Maximize2 size={18} />
              )}

              <span>
                {isFullscreen ? "Exit" : "Fullscreen"}
              </span>
            </button>
          </div>
        )}

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
                file={{ url: pdfUrl }}
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
