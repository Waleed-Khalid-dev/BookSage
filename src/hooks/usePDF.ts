import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite configuration for pdfjs worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface UsePDFResult {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  pageTextContent: any | null;
  isLoading: boolean;
  error: string | null;
  basePageSize: { width: number, height: number } | null;
  setPage: (page: number) => void;
  setScale: (scale: number | ((prev: number) => number)) => void;
}

export function usePDF(pdfPath: string | null): UsePDFResult {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageTextContent, setPageTextContent] = useState<any | null>(null);
  const [basePageSize, setBasePageSize] = useState<{ width: number, height: number } | null>(null);

  useEffect(() => {
    let active = true;
    if (!pdfPath) {
      setPdfDocument(null);
      setTotalPages(0);
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // pdfPath might be a local file path, so we load it as an ArrayBuffer using Tauri's fs or Python sidecar.
        // Wait, for Tauri v2, accessing local files can be done via convertFileSrc.
        // We will need to convert the absolute path to a URL that the webview can access.
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const assetUrl = convertFileSrc(pdfPath);
        
        const loadingTask = pdfjsLib.getDocument(assetUrl);
        const doc = await loadingTask.promise;
        
        if (active) {
          setPdfDocument(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1); // Reset to page 1 on load
          
          // Pre-fetch page 1 to establish the global base size for all pages
          try {
            const page1 = await doc.getPage(1);
            const viewport = page1.getViewport({ scale: 1.0 });
            setBasePageSize({ width: viewport.width, height: viewport.height });
          } catch (e) {
            console.error('Failed to load base page size', e);
          }
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        if (active) setError(err.message || String(err));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      active = false;
    };
  }, [pdfPath]);

  // Load text content for the current page when page changes
  useEffect(() => {
    let active = true;
    if (!pdfDocument) return;

    const loadPageData = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const textContent = await page.getTextContent();
        if (active) {
          setPageTextContent(textContent);
        }
      } catch (e) {
        console.error('Failed to load text content:', e);
      }
    };
    
    loadPageData();
    
    return () => {
      active = false;
    };
  }, [pdfDocument, currentPage]);

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    pdfDocument,
    currentPage,
    totalPages,
    scale,
    pageTextContent,
    isLoading,
    error,
    basePageSize,
    setPage,
    setScale
  };
}
