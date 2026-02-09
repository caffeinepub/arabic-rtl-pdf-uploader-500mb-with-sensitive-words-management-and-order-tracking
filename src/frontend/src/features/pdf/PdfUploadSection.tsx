import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, AlertCircle, Search, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../../backend';
import { useUploadSensitiveFile, useGetAllSensitiveWords } from '../../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { scanPdfForSensitiveWords, ScanResult } from './pdfScan';

export default function PdfUploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadMutation = useUploadSensitiveFile();
  const { data: sensitiveWordsData } = useGetAllSensitiveWords();

  const sensitiveWords = sensitiveWordsData?.map(([_, word]) => word) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[PdfUploadSection] File selected:', { name: file.name, size: file.size, type: file.type });

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file only');
      console.warn('[PdfUploadSection] Invalid file type:', file.type);
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
    setScanResult(null);
    setScanProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.warn('[PdfUploadSection] Upload attempted without file');
      return;
    }

    console.log('[PdfUploadSection] Starting upload process:', { 
      filename: selectedFile.name, 
      size: selectedFile.size 
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Root cause identified: The backend expects both blob AND filename parameters.
      // Previous code only passed the blob, causing the upload to fail.
      // Additionally, we now use ExternalBlob.fromURL for chunked upload without loading full file into RAM.
      
      console.log('[PdfUploadSection] Creating blob URL for chunked upload');
      const blobUrl = URL.createObjectURL(selectedFile);
      
      const blob = ExternalBlob.fromURL(blobUrl).withUploadProgress((percentage) => {
        console.log('[PdfUploadSection] Upload progress:', percentage);
        setUploadProgress(percentage);
      });

      console.log('[PdfUploadSection] Calling backend uploadSensitiveFile with filename:', selectedFile.name);
      
      // Fixed: Pass both blob and filename to match backend signature
      await uploadMutation.mutateAsync({ 
        blob, 
        filename: selectedFile.name 
      });
      
      console.log('[PdfUploadSection] Upload completed successfully');
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast.success('File uploaded successfully');
      setSelectedFile(null);
      setUploadProgress(0);
      setScanResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('[PdfUploadSection] Upload failed:', {
        message: error?.message,
        stack: error?.stack,
        error
      });
      
      // Improved error handling with specific messages
      let errorMessage = 'Upload failed';
      
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('permission')) {
        errorMessage = 'Upload failed: Unauthorized';
        console.error('[PdfUploadSection] Authorization error detected');
      } else if (error?.message?.includes('too large') || error?.message?.includes('size')) {
        errorMessage = 'Upload failed: File too large';
        console.error('[PdfUploadSection] File size error detected');
      } else if (error?.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    if (sensitiveWords.length === 0) {
      toast.error('No sensitive words saved. Please add sensitive words first.');
      return;
    }

    console.log('[PdfUploadSection] Starting scan:', { 
      filename: selectedFile.name, 
      wordCount: sensitiveWords.length 
    });

    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      const result = await scanPdfForSensitiveWords(
        arrayBuffer,
        sensitiveWords,
        {
          signal: abortControllerRef.current.signal,
          onProgress: (current, total) => {
            setScanProgress(Math.round((current / total) * 100));
          },
        }
      );

      console.log('[PdfUploadSection] Scan completed:', { 
        matches: result.matches.length, 
        totalPages: result.totalPages 
      });

      setScanResult(result);
      
      if (result.matches.length === 0) {
        toast.success('Scan complete - no matches found');
      } else {
        toast.success(`Found ${result.matches.length} matching word(s)/phrase(s)`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log('[PdfUploadSection] Scan cancelled by user');
        toast.info('Scan cancelled');
      } else {
        console.error('[PdfUploadSection] Scan failed:', error);
        toast.error('Scan failed');
      }
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      console.log('[PdfUploadSection] Cancelling scan');
      abortControllerRef.current.abort();
    }
  };

  const handleCancel = () => {
    console.log('[PdfUploadSection] Cancelling file selection');
    setSelectedFile(null);
    setUploadProgress(0);
    setScanResult(null);
    setScanProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload PDF Files
          </CardTitle>
          <CardDescription>
            You can upload PDF files up to 500 MB or more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Large files are uploaded in chunks to ensure success. The process may take some time depending on file size.
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
              disabled={isUploading || isScanning}
            />
            
            {!selectedFile ? (
              <label htmlFor="pdf-upload" className="cursor-pointer block">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium mb-2">Choose PDF File</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Or drag and drop it here
                </p>
                <Button type="button" variant="outline">
                  Browse Files
                </Button>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 text-right">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && !isScanning && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                {isScanning && (
                  <div className="space-y-2">
                    <Progress value={scanProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Scanning... {Math.round(scanProgress)}%
                    </p>
                  </div>
                )}

                {!isUploading && !isScanning && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button onClick={handleUpload} className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload File
                    </Button>
                    <Button 
                      onClick={handleScan} 
                      variant="secondary" 
                      className="gap-2"
                      disabled={sensitiveWords.length === 0}
                    >
                      <Search className="w-4 h-4" />
                      Scan for Sensitive Words
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}

                {isScanning && (
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleCancelScan} 
                      variant="destructive" 
                      className="gap-2"
                    >
                      <StopCircle className="w-4 h-4" />
                      Stop Scan
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Scan Results
            </CardTitle>
            <CardDescription>
              {scanResult.matches.length === 0
                ? 'No sensitive words found in the file'
                : `Found ${scanResult.matches.length} matching word(s)/phrase(s) in ${scanResult.totalPages} page(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult.matches.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Matching Word/Phrase</TableHead>
                      <TableHead className="text-right">Page Numbers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanResult.matches.map((match, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{match.phrase}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {match.pages.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No matches found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
