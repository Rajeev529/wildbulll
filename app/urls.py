from django.urls import path,include
from . import views, image_process
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
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)