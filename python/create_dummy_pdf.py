import fitz

doc = fitz.open()

# Chapter 1
page1 = doc.new_page()
page1.insert_text((50, 50), "This is Chapter 1 text.\nIt has some content.")

# Chapter 2
page2 = doc.new_page()
page2.insert_text((50, 50), "This is Chapter 2 text.\nIt has different content.")

# Add TOC
# TOC format: [level, title, page_number (1-based)]
toc = [
    [1, "Chapter 1", 1],
    [1, "Chapter 2", 2]
]
doc.set_toc(toc)

doc.set_metadata({"title": "Test Dummy Book", "author": "AI Assistant"})
doc.save("dummy.pdf")
print("dummy.pdf created successfully.")
