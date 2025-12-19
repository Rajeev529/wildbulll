import os
import io
import zipfile
import base64
import subprocess
import tempfile
import shutil

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def _compress_with_debug(input_pdf, output_pdf, target_kb):
    qualities = [
        "/screen",
        "/ebook",
        "/printer",
        "/prepress"
    ]

    print("Starting Ghostscript compression attempts...")

    best_size = float("inf")

    for q in qualities:
        print(f"→ Trying quality {q}")

        try:
            subprocess.run(
                [
                    "gs",
                    "-sDEVICE=pdfwrite",
                    "-dCompatibilityLevel=1.4",
                    f"-dPDFSETTINGS={q}",
                    "-dNOPAUSE",
                    "-dQUIET",
                    "-dBATCH",
                    f"-sOutputFile={output_pdf}",
                    input_pdf
                ],
                timeout=30
            )

            size_kb = os.path.getsize(output_pdf) // 1024
            print(f"   Output size: {size_kb} KB")

            best_size = min(best_size, size_kb)

            if size_kb <= target_kb:
                print("   ✅ Target achieved")
                return

        except Exception as e:
            print("   ❌ Ghostscript error:", str(e))

    print(f"⚠️ Target not achievable. Best possible: {best_size} KB")

@csrf_exempt
def compress_pdfs(request):
    print("===== START PDF COMPRESSION =====")

    if request.method != "POST":
        print("❌ Invalid request method")
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    files = request.FILES.getlist("files")
    target_kb = request.POST.get("targetSize")

    print(f"Received files: {len(files)} | Target KB: {target_kb}")

    if not files:
        print("❌ No files uploaded")
        return JsonResponse({"error": "No files uploaded"}, status=400)

    try:
        target_kb = int(target_kb)
        if target_kb < 10:
            raise ValueError
    except Exception:
        print("❌ Invalid target size")
        return JsonResponse({"error": "Invalid target size"}, status=400)

    gs_path = shutil.which("gs")
    print(f"Ghostscript found: {bool(gs_path)}")

    results = []
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for idx, pdf in enumerate(files, start=1):
            print(f"\n--- Processing file #{idx}: {pdf.name} ---")

            if not pdf.name.lower().endswith(".pdf"):
                print("⚠️ Skipped (not PDF)")
                continue

            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as in_f:
                    in_f.write(pdf.read())
                    input_path = in_f.name

                input_size_kb = os.path.getsize(input_path) // 1024
                print(f"Original size: {input_size_kb} KB")

                output_path = input_path.replace(".pdf", "_compressed.pdf")

                if gs_path:
                    _compress_with_debug(
                        input_path, output_path, target_kb
                    )
                else:
                    print("⚠️ Ghostscript not installed, skipping compression")
                    shutil.copy(input_path, output_path)

                final_size_kb = max(1, os.path.getsize(output_path) // 1024)
                print(f"Final size: {final_size_kb} KB")

                with open(output_path, "rb") as f:
                    pdf_bytes = f.read()

                b64_pdf = base64.b64encode(pdf_bytes).decode()
                safe_name = f"shrunk_{pdf.name}"

                results.append({
                    "file_name": safe_name,
                    "size_kb": final_size_kb,
                    "base64": f"data:application/pdf;base64,{b64_pdf}"
                })

                zipf.writestr(safe_name, pdf_bytes)

            except Exception as e:
                print("❌ ERROR processing file:", str(e))

            finally:
                for p in [input_path, output_path]:
                    if p and os.path.exists(p):
                        os.remove(p)

    print("===== END PDF COMPRESSION =====\n")

    zip_buffer.seek(0)
    zip_b64 = base64.b64encode(zip_buffer.read()).decode()

    return JsonResponse({
        "files": results,
        "zip_name": "compressed_pdfs.zip",
        "zip_base64": f"data:application/zip;base64,{zip_b64}"
    })