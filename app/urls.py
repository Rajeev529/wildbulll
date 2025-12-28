from django.urls import path,include
from . import views, image_process, csv, pdf
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path("",views.homepage,name="homepage"),
    path("resize-image",views.re_img,name="image_resize"),
    path("compress-images/",image_process.compress_images ,name="engine_image_resizer"),
    path("image-to-pdf/",views.img2pdf ,name="engine_image_resizer"),
    path("images-to-pdf/",image_process.images_to_pdf,name="engine_image2pdf"),
    path("image-to-scanned-image",views.img2scanned),
    path("convert-to-scanned/",image_process.convert_to_scanned),
    path("any-to-jpg-png-converter",views.tojpg),
    path("convert_image_extension/",image_process.convert_image_extension),
    path("add-wattermark-image",views.image_to_wattermark),
    path("add-watermark-process/",image_process.watermark_images),
    path("about",views.about),
    path("excel-to-pdf-converter",views.csv2pdf),
    path("excel-to-pdf/", csv.excel_to_pdf_ajax, name="excel_to_pdf"),
    path("excel-csv-converter",views.intocsvexcel),
    path("convert-data/", csv.convert_data, name="excel_to_pdf"),
    path("crop-&-rotate-image",views.crop_rotate),
    path("pdf-compressor",views.pdf_shrink),
    path("compress-pdf/", pdf.pdf_compressor),
    path("pdf-merge",views.merge_pdf),
    # path("chat-process/", chat.process_text_view),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)