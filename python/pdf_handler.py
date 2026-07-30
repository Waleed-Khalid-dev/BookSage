import fitz  # PyMuPDF
from typing import Dict, Any, List

def get_book_metadata(pdf_path: str) -> Dict[str, Any]:
    """
    Opens a PDF and extracts basic metadata and Table of Contents.
    """
    try:
        doc = fitz.open(pdf_path)
        toc = doc.get_toc()  # Format: [level, title, page_number]
        metadata = doc.metadata
        
        result = {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "page_count": doc.page_count,
            "toc": toc
        }
        return result
    except Exception as e:
        raise Exception(f"Failed to read PDF metadata: {str(e)}")

def extract_page_range(pdf_path: str, start_page: int, end_page: int) -> str:
    """
    Extracts text from a given range of pages (1-indexed based on TOC output).
    """
    try:
        doc = fitz.open(pdf_path)
        # PyMuPDF pages are 0-indexed, but TOC page numbers are typically 1-indexed.
        text_content = []
        
        # Ensure bounds
        start_idx = max(0, start_page - 1)
        end_idx = min(doc.page_count, end_page) # end_page from TOC is usually exclusive start of next chapter
        
        for i in range(start_idx, end_idx):
            page = doc.load_page(i)
            text_content.append(page.get_text("text"))
            
        return "\n".join(text_content)
    except Exception as e:
        raise Exception(f"Failed to extract text: {str(e)}")
