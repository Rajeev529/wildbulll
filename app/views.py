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
