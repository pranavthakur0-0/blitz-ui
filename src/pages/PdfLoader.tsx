import axios from 'axios';
import { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();



const PdfLoader = ({documentId}: {documentId: string | undefined}) => {
    
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);



    useEffect(() => {
        const fetchDocument = async () => {
          try {
            setDocumentLoaded(false);
            setPdfError(null);
            
            const response = await axios.get(
              `/app/documents/${documentId}/get-complete-document`,
              { 
                responseType: 'blob',
                timeout: 30000 // 30 second timeout
              }
            );
            
            // Ensure we got a PDF blob
            if (response.data.type !== 'application/pdf') {
              throw new Error('Invalid file type - expected PDF');
            }
            
            const url = URL.createObjectURL(response.data);
            setDocumentUrl(url);
          } catch (error) {
            console.error('Document fetch error:', error);
            setPdfError(`Failed to fetch document: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        };
        
        if (documentId) {
          fetchDocument();
        }
        return () => {
          if (documentUrl) {
            URL.revokeObjectURL(documentUrl);
          }
        };
      }, [documentId]);


    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        console.log('Document loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setDocumentLoaded(true);
        setPdfError(null);
      };
    
      const onDocumentLoadError = (error: Error) => {
        console.error('PDF Load Error:', error);
        setPdfError(`Failed to load PDF document: ${error.message}`);
        setDocumentLoaded(false);
      };


  return <div className="chat-page__studio-panel">
  {pdfError && (
    <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
      <p>Error: {pdfError}</p>
      <button 
        onClick={() => window.location.reload()} 
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        Reload Page
      </button>
    </div>
  )}
  
  {documentUrl && !pdfError && (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ 
        padding: '10px', 
        textAlign: 'center', 
        borderBottom: '1px solid #ccc',
        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <span style={{ fontWeight: 'bold' }}>
          {numPages ? `${numPages} page${numPages > 1 ? 's' : ''}` : 'Loading...'}
        </span>
      </div>
      
      <Document
        key={crypto.randomUUID()}
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        error={<div style={{ padding: '20px', textAlign: 'center' }}>Failed to load PDF file.</div>}
        loading={<div style={{ padding: '20px', textAlign: 'center' }}>Loading PDF...</div>}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '20px',
          padding: '20px 0'
        }}>
          {documentLoaded && numPages && numPages > 0 ? (
            Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              console.log(`Rendering page ${pageNumber} of ${numPages}`);
              return (
                <div key={pageNumber} style={{ 
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '8px',
                    backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--text-secondary, #666)',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    Page {pageNumber}
                  </div>
                  <Page 
                    pageNumber={pageNumber}
                    width={Math.min(600, window.innerWidth - 100)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={() => {
                      console.log(`Page ${pageNumber} loaded successfully`);
                    }}
                    onLoadError={(error) => {
                      console.error(`Page ${pageNumber} load error:`, error);
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {documentLoaded ? 'No pages found in document' : 'Loading pages...'}
            </div>
          )}
        </div>
      </Document>
    </div>
  )}
  
  {!documentUrl && !pdfError && (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      Loading document...
    </div>
  )}
</div>;
};

export default PdfLoader;