import io
import base64
from django.http import JsonResponse
from pypdf import PdfReader, PdfWriter
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def pdf_compressor(request):
    print("\n====== PDF COMPRESSOR HIT ======")

    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request'}, status=400)

    uploaded_file = request.FILES.get('pdf_file')
    level = request.POST.get('level', 1)

    if not uploaded_file:
        return JsonResponse({'error': 'No file uploaded'}, status=400)

    try:
        input_buffer = io.BytesIO(uploaded_file.read())
        reader = PdfReader(input_buffer)
        writer = PdfWriter()

        for i, page in enumerate(reader.pages):
            print(f"Adding page {i+1}")
            writer.add_page(page)

            writer_page = writer.pages[-1]
            print(f"Compressing page {i+1}")
            writer_page.compress_content_streams()

        output_buffer = io.BytesIO()
        writer.write(output_buffer)
        pdf_data = output_buffer.getvalue()

        print("✅ Compression done")

        return JsonResponse({
            'status': 'success',
            'name': uploaded_file.name,
            'original_size': f"{uploaded_file.size / 1024:.1f}",
            'new_size': f"{len(pdf_data) / 1024:.1f}",
            'level': level,
            'base64': base64.b64encode(pdf_data).decode('utf-8')
        })

    except Exception as e:
        print("🔥 ERROR:", type(e).__name__, e)
        return JsonResponse({'error': str(e)}, status=500)



from django.views.decorators.http import require_POST
from django.http import HttpResponse, JsonResponse
from PIL import Image, ImageEnhance, ImageFilter
import io

@require_POST
def scan_pdf_ajax(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    images = request.FILES.getlist("images")
    scanned_pages = []

    try:
        for f in images:
            img = Image.open(f).convert("L")

            # Scan effect
            img = ImageEnhance.Contrast(img).enhance(1.9)
            img = ImageEnhance.Brightness(img).enhance(1.05)
            img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=180))
            img = img.point(lambda x: 0 if x < 150 else 255, "1")

            scanned_pages.append(img.convert("RGB"))

        if not scanned_pages:
            return JsonResponse({"error": "No images"}, status=400)

        # 🔥 CREATE PDF IN MEMORY
        pdf_buffer = io.BytesIO()
        scanned_pages[0].save(
            pdf_buffer,
            format="PDF",
            save_all=True,
            append_images=scanned_pages[1:]
        )
        pdf_buffer.seek(0)

        # 🔥 STREAM RESPONSE
        response = HttpResponse(
            pdf_buffer.read(),
            content_type="application/pdf"
        )
        response["Content-Disposition"] = 'attachment; filename="scanned.pdf"'
        return response

    except Exception as e:
        print("SCAN ERROR:", e)
        return JsonResponse({"error": "Scan failed"}, status=500)
