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

