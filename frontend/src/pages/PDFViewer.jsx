
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from "react";

import {
  FaWhatsapp,
  FaTelegramPlane,
  FaFacebookF,
  FaLinkedinIn,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";

import { useParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";

import {
  ArrowLeft,
  Download,
  FileText,
  LoaderCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Share2,
  Plus,
  Minus,
} from "lucide-react";

import StudentNavbar from "../components/StudentNavbar";
import API from "../services/api";

import "../styles/pdf-viewer.css";

// PDF.JS WORKER
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ZOOM LIMITS
const MIN_ZOOM = 70;
const MAX_ZOOM = 200;

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

// DISTANCE BETWEEN TWO TOUCH POINTS
function getTouchDistance(touches) {
  const x = touches[0].clientX - touches[1].clientX;
  const y = touches[0].clientY - touches[1].clientY;

  return Math.sqrt(x * x + y * y);
}

// INDIVIDUAL FLIP BOOK PAGE
const FlipPDFPage = forwardRef(function FlipPDFPage(
  { pageNumber, width },
  ref
) {
  return (
    <div
      ref={ref}
      className="flip-pdf-page"
      data-page-number={pageNumber}
    >
      <div className="flip-pdf-page-content">
        <Page
          pageNumber={pageNumber}
          width={width}
          devicePixelRatio={Math.max(
            2,
            typeof window !== "undefined"
              ? window.devicePixelRatio || 1
              : 1
          )}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="flip-pdf-placeholder">
              <LoaderCircle size={22} className="pdf-spin" />
              <span>Loading page {pageNumber}...</span>
            </div>
          }
        />

        <span className="flip-pdf-page-number">
          {pageNumber}
        </span>
      </div>
    </div>
  );
});

FlipPDFPage.displayName = "FlipPDFPage";

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
  const bookContainerRef = useRef(null);
  const bookRef = useRef(null);
  const shareWrapperRef = useRef(null);
  const requestIdRef = useRef(0);

  // PINCH ZOOM REFS
  const pinchStartDistanceRef = useRef(0);
  const pinchStartZoomRef = useRef(100);

  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("Study Material.pdf");
  const [fileSize, setFileSize] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const [zoom, setZoom] = useState(100);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [containerWidth, setContainerWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return Math.max(200, window.innerWidth - 40);
    }

    return 900;
  });

  const [pdfVersion, setPdfVersion] = useState(0);

  const isMobile = containerWidth <= 700;

  // FETCH SIGNED PDF URL
  const loadPDF = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError("");
      setPdfUrl("");
      setNumPages(0);
      setCurrentPage(1);
      setZoom(100);

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

      if (requestId !== requestIdRef.current) return;

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

      setPdfUrl(signedUrl);
      setPdfVersion((previous) => previous + 1);
    } catch (err) {
      console.error("PDF URL loading failed:", err);

      if (requestId === requestIdRef.current) {
        setError("Unable to load this PDF. Please try again.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [materialId]);

  // INITIAL LOAD AND MATERIAL CHANGE
  useEffect(() => {
    loadPDF();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadPDF]);

  // MEASURE AVAILABLE WIDTH
  useEffect(() => {
    const element = bookContainerRef.current;

    if (!element) return;

    function updateWidth() {
      const width = element.clientWidth;

      if (width > 0) {
        setContainerWidth(width);
      }
    }

    updateWidth();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(updateWidth);

      observer.observe(element);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [isFullscreen, loading]);

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

  // CLOSE SHARE MENU WHEN CLICKING OUTSIDE
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        shareWrapperRef.current &&
        !shareWrapperRef.current.contains(event.target)
      ) {
        setShareMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShareMenuOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // PDF LOAD SUCCESS
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setError("");
  }, []);

  // PDF LOAD ERROR
  const onDocumentLoadError = useCallback((err) => {
    console.error("PDF rendering failed:", err);

    setError(
      "Unable to display this PDF. Please check your connection."
    );
  }, []);

  // PAGE FLIP EVENT
  const onFlip = useCallback((event) => {
    setCurrentPage(event.data + 1);
  }, []);

  // PAGE NAVIGATION
  const previousPage = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const nextPage = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext();
  }, []);

  // KEYBOARD NAVIGATION
  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        nextPage();
      }

      if (event.key === "ArrowLeft") {
        previousPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextPage, previousPage]);

  // SHARE LINK
  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const shareTitle = fileName || "NIE PDF HUB Study Material";
  const shareText = `View ${shareTitle} on NIE PDF HUB`;

  // SHARE TO SOCIAL PLATFORMS
  function openShareLink(platform) {
    const encodedUrl = encodeURIComponent(shareUrl);

    const encodedText = encodeURIComponent(
      `${shareText}\n${shareUrl}`
    );

    const encodedTitle = encodeURIComponent(shareTitle);

    const shareLinks = {
      whatsapp: `https://wa.me/?text=${encodedText}`,

      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
        shareText
      )}`,

      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,

      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,

      email: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
    };

    const target = shareLinks[platform];

    if (target) {
      window.open(target, "_blank", "noopener,noreferrer");
    }

    setShareMenuOpen(false);
  }

  // COPY LINK
  async function copyShareLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);

        alert(
          "NIE PDF HUB link copied. You can now paste it anywhere."
        );
      } else {
        const temporaryInput = document.createElement("textarea");

        temporaryInput.value = shareUrl;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.left = "-9999px";

        document.body.appendChild(temporaryInput);
        temporaryInput.select();

        const copied = document.execCommand("copy");

        document.body.removeChild(temporaryInput);

        alert(
          copied ? "Link copied!" : `Copy this link: ${shareUrl}`
        );
      }
    } catch (err) {
      console.error("Copy link failed:", err);
      alert(`Copy this link: ${shareUrl}`);
    }

    setShareMenuOpen(false);
  }

  // ZOOM CONTROLS
  const zoomIn = useCallback(() => {
    setZoom((current) =>
      Math.min(MAX_ZOOM, current + 10)
    );
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) =>
      Math.max(MIN_ZOOM, current - 10)
    );
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  // HAND PINCH ZOOM
  const handleTouchStart = useCallback((event) => {
    if (event.touches.length === 2) {
      pinchStartDistanceRef.current =
        getTouchDistance(event.touches);

      pinchStartZoomRef.current = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((event) => {
    if (
      event.touches.length === 2 &&
      pinchStartDistanceRef.current > 0
    ) {
      // Prevent browser's default pinch gesture
      event.preventDefault();

      const currentDistance = getTouchDistance(
        event.touches
      );

      const scale =
        currentDistance / pinchStartDistanceRef.current;

      const nextZoom = Math.round(
        pinchStartZoomRef.current * scale
      );

      setZoom(
        Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, nextZoom)
        )
      );
    }
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (event.touches.length < 2) {
      pinchStartDistanceRef.current = 0;
    }
  }, []);

  // TRACKPAD PINCH ZOOM
  const handleWheel = useCallback((event) => {
    // Ctrl + wheel is commonly used by trackpad pinch gestures
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();

      setZoom((current) => {
        const change = event.deltaY < 0 ? 5 : -5;

        return Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, current + change)
        );
      });
    }
  }, []);

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

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 3000);
    } catch (err) {
      console.error("PDF download failed:", err);

      alert("Unable to download this PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  // RESPONSIVE PAGE DIMENSIONS
  const availablePageWidth = isMobile
    ? containerWidth - 16
    : (containerWidth - 40) / 2;

  const pageWidth = Math.max(
    160,
    Math.min(availablePageWidth, 480)
  );

  const pageHeight = Math.round(pageWidth * 1.414);

  // ZOOM CALCULATIONS
  const zoomScale = zoom / 100;

  const bookWidth = pageWidth * (isMobile ? 1 : 2);

  const scaledBookWidth = Math.round(
    bookWidth * zoomScale
  );

  const scaledBookHeight = Math.round(
    pageHeight * zoomScale
  );

  // ZOOM STAGE
  const stageWidth = Math.max(
    containerWidth,
    scaledBookWidth
  );

  const stageLeft = Math.max(
    0,
    (stageWidth - scaledBookWidth) / 2
  );

  // PAGE COUNTER
  const lastVisiblePage = isMobile
    ? currentPage
    : Math.min(currentPage + 1, numPages);

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

          <div className="pdf-heading-actions">
            {/* SHARE BUTTON */}
            <div
              className="pdf-share-wrapper"
              ref={shareWrapperRef}
            >
              <button
                type="button"
                onClick={() =>
                  setShareMenuOpen((open) => !open)
                }
                disabled={loading || !!error}
                className="pdf-tool-button pdf-share-button"
                title="Share PDF"
                aria-expanded={shareMenuOpen}
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>

              {shareMenuOpen && (
                <div className="pdf-share-menu" role="menu">
                  <p>Share study material</p>

                  <button
                    type="button"
                    className="share-option whatsapp"
                    onClick={() => openShareLink("whatsapp")}
                  >
                    <FaWhatsapp />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="share-option telegram"
                    onClick={() => openShareLink("telegram")}
                  >
                    <FaTelegramPlane />
                    <span>Telegram</span>
                  </button>

                  <button
                    type="button"
                    className="share-option facebook"
                    onClick={() => openShareLink("facebook")}
                  >
                    <FaFacebookF />
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    className="share-option linkedin"
                    onClick={() => openShareLink("linkedin")}
                  >
                    <FaLinkedinIn />
                    <span>LinkedIn</span>
                  </button>

                  <button
                    type="button"
                    className="share-option email"
                    onClick={() => openShareLink("email")}
                  >
                    <FaEnvelope />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    className="share-option copy-link"
                    onClick={copyShareLink}
                  >
                    <FaLink />
                    <span>Copy Link</span>
                  </button>
                </div>
              )}
            </div>

            {/* DOWNLOAD */}
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
        </div>

        {/* READER TOOLBAR */}
        {!loading && !error && pdfUrl && numPages > 0 && (
          <div className="pdf-toolbar">
            <div className="pdf-toolbar-group pdf-zoom-controls">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                title="Zoom out"
                aria-label="Zoom out"
                className="pdf-tool-button"
              >
                <Minus size={18} />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                title="Reset zoom to 100%"
                className="pdf-zoom-reset"
              >
                {zoom}%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                title="Zoom in"
                aria-label="Zoom in"
                className="pdf-tool-button"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="pdf-toolbar-group pdf-page-navigation">
              <button
                type="button"
                onClick={previousPage}
                disabled={currentPage <= 1}
                title="Previous page"
                className="pdf-tool-button"
              >
                <ChevronLeft size={19} />
              </button>

              <span className="pdf-page-count">
                {currentPage}–{lastVisiblePage} / {numPages}
              </span>

              <button
                type="button"
                onClick={nextPage}
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

        {/* PDF BOOK AREA */}
        <div
          ref={bookContainerRef}
          className="pdf-book-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
        >
          {loading && (
            <div className="pdf-loading">
              <LoaderCircle size={30} className="pdf-spin" />
              <p>Preparing PDF...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <AlertCircle size={25} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <Document
              key={`${materialId}-${pdfVersion}`}
              file={{ url: pdfUrl }}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              options={{
                disableAutoFetch: false,
                rangeChunkSize: 65536,
              }}
              loading={
                <div className="pdf-loading">
                  <LoaderCircle size={30} className="pdf-spin" />
                  <p>Loading PDF document...</p>
                </div>
              }
              error={
                <div className="pdf-error">
                  Unable to render this PDF.
                </div>
              }
            >
              {numPages > 0 && (
                <div
                  className="pdf-book-zoom-stage"
                  style={{
                    width: `${stageWidth}px`,
                    height: `${scaledBookHeight}px`,
                  }}
                >
                  <div
                    className="pdf-book-zoom-content"
                    style={{
                      width: `${bookWidth}px`,
                      height: `${pageHeight}px`,
                      left: `${stageLeft}px`,
                      transform: `scale(${zoomScale})`,
                    }}
                  >
                    <HTMLFlipBook
                      ref={bookRef}
                      key={`${materialId}-${pdfVersion}-${isMobile ? "mobile" : "desktop"}`}
                      width={pageWidth}
                      height={pageHeight}
                      size="fixed"
                      minWidth={pageWidth}
                      maxWidth={pageWidth}
                      minHeight={pageHeight}
                      maxHeight={pageHeight}
                      drawShadow={true}
                      flippingTime={900}
                      usePortrait={isMobile}
                      startPage={Math.max(
                        0,
                        Math.min(currentPage - 1, numPages - 1)
                      )}
                      autoSize={false}
                      maxShadowOpacity={0.45}
                      showCover={false}
                      mobileScrollSupport={true}
                      useMouseEvents={false}
                      swipeDistance={30}
                      clickEventForward={false}
                      onFlip={onFlip}
                      className="nie-flip-book"
                      style={{ margin: "0 auto" }}
                    >
                      {Array.from(
                        { length: numPages },
                        (_, index) => (
                          <FlipPDFPage
                            key={`flip-page-${index + 1}`}
                            pageNumber={index + 1}
                            width={pageWidth}
                          />
                        )
                      )}
                    </HTMLFlipBook>
                  </div>
                </div>
              )}
            </Document>
          )}
        </div>

        {/* READER HINT */}
        {!loading && !error && numPages > 0 && (
          <p className="pdf-reader-hint">
            {isMobile
              ? "Pinch with two fingers to zoom. Use the arrows to turn pages."
              : "Use the arrows or keyboard to turn pages. Pinch on a touchpad to zoom."}
          </p>
        )}
      </main>
    </div>
  );
}

export default PDFViewer;
