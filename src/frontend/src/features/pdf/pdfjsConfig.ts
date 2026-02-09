// PDF.js types for CDN usage
export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

export interface PDFPageProxy {
  getTextContent(): Promise<TextContent>;
}

export interface TextContent {
  items: TextItem[];
}

export interface TextItem {
  str: string;
}

export interface PDFJSStatic {
  getDocument(data: Uint8Array): { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  version: string;
}

// Load PDF.js from CDN
let pdfjsLib: PDFJSStatic | null = null;

export async function loadPDFJS(): Promise<PDFJSStatic> {
  if (pdfjsLib) {
    return pdfjsLib;
  }

  // Load PDF.js from CDN
  const script = document.createElement('script');
  script.type = 'module';
  
  return new Promise((resolve, reject) => {
    const moduleScript = `
      import * as pdfjs from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';
      window.__pdfjs = pdfjs;
      window.dispatchEvent(new Event('pdfjsloaded'));
    `;
    
    const blob = new Blob([moduleScript], { type: 'text/javascript' });
    script.src = URL.createObjectURL(blob);
    
    const handleLoad = () => {
      pdfjsLib = (window as any).__pdfjs;
      if (pdfjsLib) {
        resolve(pdfjsLib);
      } else {
        reject(new Error('Failed to load PDF.js'));
      }
      URL.revokeObjectURL(script.src);
    };
    
    window.addEventListener('pdfjsloaded', handleLoad, { once: true });
    script.onerror = () => {
      reject(new Error('Failed to load PDF.js script'));
      URL.revokeObjectURL(script.src);
    };
    
    document.head.appendChild(script);
  });
}
