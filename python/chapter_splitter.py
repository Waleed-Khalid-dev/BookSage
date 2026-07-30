import os
import re
from pathlib import Path
from pdf_handler import get_book_metadata, extract_page_range
from typing import List, Dict, Any

def get_projects_dir() -> Path:
    """Returns the BookSage_Projects directory in the user's Documents folder."""
    docs_dir = Path.home() / "Documents"
    projects_dir = docs_dir / "BookSage_Projects"
    projects_dir.mkdir(parents=True, exist_ok=True)
    return projects_dir

def clean_filename(filename: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '', filename).strip()

def fallback_chapter_split(pdf_path: str, page_count: int, book_dir: Path) -> List[Dict[str, Any]]:
    """
    Fallback if no TOC exists. Extracts all text and looks for 'Chapter X' via regex,
    or just splits by chunks of pages if regex fails.
    For Phase 1, we will chunk every 20 pages if no regex matches.
    """
    # Simple chunking for now (20 pages per chapter)
    chapters = []
    chunk_size = 20
    chapter_num = 1
    
    for start_page in range(1, page_count + 1, chunk_size):
        end_page = min(start_page + chunk_size - 1, page_count)
        text = extract_page_range(pdf_path, start_page, end_page)
        
        chapter_title = f"Chapter {chapter_num}"
        file_path = book_dir / f"chapter_{chapter_num:03d}.txt"
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(text)
            
        chapters.append({
            "chapter_num": chapter_num,
            "title": chapter_title,
            "start_page": start_page,
            "end_page": end_page,
            "file": str(file_path)
        })
        chapter_num += 1
        
    return chapters

def split_book_into_chapters(pdf_path: str) -> Dict[str, Any]:
    """
    Splits the PDF into text files per chapter using TOC.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
    metadata = get_book_metadata(pdf_path)
    toc = metadata.get("toc", [])
    page_count = metadata.get("page_count", 0)
    
    # Determine book folder
    book_title = metadata.get("title", "") or Path(pdf_path).stem
    safe_title = clean_filename(book_title)
    book_dir = get_projects_dir() / safe_title
    book_dir.mkdir(parents=True, exist_ok=True)
    
    chapters_metadata = []
    
    if toc:
        # Use TOC to determine chapters
        # TOC items: [level, title, page_number]
        # We'll just grab level 1 items for top-level chapters for simplicity
        lvl1_items = [item for item in toc if item[0] == 1]
        
        if not lvl1_items:
            # If no level 1, just use all TOC items
            lvl1_items = toc
            
        for i, item in enumerate(lvl1_items):
            level, title, start_page = item
            
            # End page is the start of the next chapter, or EOF
            end_page = lvl1_items[i+1][2] if i + 1 < len(lvl1_items) else page_count
            
            # Handle edge case where chapters point to same page
            if end_page < start_page:
                end_page = start_page
                
            text = extract_page_range(pdf_path, start_page, end_page)
            
            chapter_num = i + 1
            safe_chap_title = clean_filename(title)
            file_name = f"{chapter_num:03d}_{safe_chap_title}.txt"
            file_path = book_dir / file_name
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(text)
                
            chapters_metadata.append({
                "chapter_num": chapter_num,
                "title": title,
                "start_page": start_page,
                "end_page": end_page,
                "file": str(file_path)
            })
    else:
        chapters_metadata = fallback_chapter_split(pdf_path, page_count, book_dir)
        
    # Save the book index
    import json
    index_path = book_dir / "index.json"
    index_data = {
        "title": book_title,
        "author": metadata.get("author", ""),
        "total_chapters": len(chapters_metadata),
        "chapters": chapters_metadata
    }
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2)
        
    return {
        "status": "success",
        "book_dir": str(book_dir),
        "total_chapters": len(chapters_metadata),
        "metadata": index_data
    }
