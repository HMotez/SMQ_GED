"""
pdf_to_docx.py — Convert PDF to DOCX using pdf2docx (text-aware conversion)
Usage: python3 pdf_to_docx.py <input.pdf> <output.docx>
"""
import sys
from pdf2docx import Converter

if len(sys.argv) != 3:
    print("Usage: pdf_to_docx.py <input.pdf> <output.docx>", file=sys.stderr)
    sys.exit(1)

src  = sys.argv[1]
dest = sys.argv[2]

try:
    cv = Converter(src)
    cv.convert(dest, start=0, end=None)
    cv.close()
    print(f"OK: {dest}")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
