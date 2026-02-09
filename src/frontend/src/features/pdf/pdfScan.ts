import { loadPDFJS, PDFJSStatic } from './pdfjsConfig';

export interface ScanMatch {
  phrase: string;
  pages: number[];
}

export interface ScanResult {
  matches: ScanMatch[];
  totalPages: number;
  scannedPages: number;
}

export interface ScanOptions {
  signal?: AbortSignal;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Scans a PDF file for sensitive words/phrases and returns matches with page numbers
 * @param pdfData - PDF file as ArrayBuffer
 * @param sensitiveWords - Array of words/phrases to search for
 * @param options - Optional scan configuration
 * @returns Scan results with matched phrases and their page numbers (1-based)
 */
export async function scanPdfForSensitiveWords(
  pdfData: ArrayBuffer,
  sensitiveWords: string[],
  options: ScanOptions = {}
): Promise<ScanResult> {
  const { signal, onProgress } = options;

  // Load PDF.js library
  const pdfjsLib: PDFJSStatic = await loadPDFJS();

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument(new Uint8Array(pdfData));
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;
  const matchMap = new Map<string, Set<number>>();

  // Initialize match map with all sensitive words
  sensitiveWords.forEach((word) => {
    matchMap.set(word, new Set<number>());
  });

  let scannedPages = 0;

  // Process each page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    // Check for cancellation
    if (signal?.aborted) {
      break;
    }

    // Report progress
    if (onProgress) {
      onProgress(pageNum, totalPages);
    }

    try {
      // Get page and extract text
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items into a single string
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .toLowerCase();

      // Check each sensitive word/phrase
      sensitiveWords.forEach((phrase) => {
        const normalizedPhrase = phrase.toLowerCase().trim();
        
        // Check if the phrase exists in the page text
        if (pageText.includes(normalizedPhrase)) {
          matchMap.get(phrase)?.add(pageNum);
        }
      });

      scannedPages = pageNum;
    } catch (error) {
      console.error(`Error processing page ${pageNum}:`, error);
      // Continue with next page
    }
  }

  // Convert match map to result format
  const matches: ScanMatch[] = [];
  matchMap.forEach((pages, phrase) => {
    if (pages.size > 0) {
      matches.push({
        phrase,
        pages: Array.from(pages).sort((a, b) => a - b),
      });
    }
  });

  return {
    matches,
    totalPages,
    scannedPages,
  };
}
