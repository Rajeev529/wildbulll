from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# Create your views here.

def homepage(request):

    return render(request, 'index.html')

@ensure_csrf_cookie
def re_img(request):
    return render(request, 'size_re.html')
def img2pdf(request):
    return render(request, 'image_to_pdf.html')
def img2scanned(request):
    return render(request, 'image_to_scanned.html')
def tojpg(request):
    return render(request, 'tojpg.html')

@ensure_csrf_cookie
def image_to_wattermark(request):
    return render(request, 'image_to_wattermark.html')

def about(request):
    return render(request, 'about.html')
def csv2pdf(request):
    return render(request, 'csv2pdf.html')
def intocsvexcel(request):
    return render(request, 'into_csv_excel.html')
def crop_rotate(request):
    return render(request, 'edit_image.html')
def pdf_shrink(request):
    return render(request, 'pdf_shrink.html')
def merge_pdf(request):
    return render(request, 'pdf_merge.html')
def scan_pdf(request):
    return render(request, 'pdf_scan.html')
