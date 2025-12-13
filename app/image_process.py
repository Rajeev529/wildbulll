from django.http import JsonResponse
from PIL import Image
import io
import base64

from django.views.decorators.csrf import csrf_exempt

import base64
from io import BytesIO
from PIL import Image
from django.http import JsonResponse


def compress_images(request):
    if request.method == "POST":
        target_kb = int(request.POST.get("targetKb", 50))
        max_bytes = target_kb * 1024
        compressed_results = []

        files = request.FILES.getlist("images")

        for file in files:
            img = Image.open(file)

            # Convert all images to RGB for consistent JPEG compression
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # ------ FIRST PASS: QUALITY REDUCTION ------
            quality = 95
            buffer = BytesIO()

            img.save(buffer, format="JPEG", quality=quality)
            size = buffer.tell()

            # Reduce quality down to 10
            while size > max_bytes and quality > 10:
                quality -= 5
                buffer = BytesIO()
                img.save(buffer, format="JPEG", quality=quality)
                size = buffer.tell()

            # ------ SECOND PASS: RESOLUTION REDUCTION ------
            # If still too large, start reducing dimensions
            if size > max_bytes:
                width, height = img.size

                # keep reducing by 10% each iteration
                while size > max_bytes and (width > 200 and height > 200):
                    width = int(width * 0.85)
                    height = int(height * 0.85)

                    resized_img = img.resize((width, height), Image.LANCZOS)

                    # Try different qualities again on smaller image
                    q = 90
                    buffer = BytesIO()
                    resized_img.save(buffer, "JPEG", quality=q)
                    size = buffer.tell()

                    # Further reduce quality if needed
                    while size > max_bytes and q > 10:
                        q -= 5
                        buffer = BytesIO()
                        resized_img.save(buffer, "JPEG", quality=q)
                        size = buffer.tell()

            # Final result in buffer now
            final_size_kb = round(size / 1024, 2)
            base64_data = base64.b64encode(buffer.getvalue()).decode()

            compressed_results.append({
                "filename": file.name,
                "size_kb": final_size_kb,
                "base64": f"data:image/jpeg;base64,{base64_data}",
            })
            print(compressed_results)
        return JsonResponse({"processed": compressed_results})

    return JsonResponse({"error": "Invalid request"}, status=400)


from PIL import Image, ImageOps
import io
from django.http import JsonResponse, HttpResponse

def images_to_pdf(request):
    print("\n\n===== START images_to_pdf REQUEST =====")

    if request.method == "POST":

        image_list = []
        files = request.FILES.getlist('images')

        print(f"Total Files Received: {len(files)}")

        for index, f in enumerate(files):
            print(f"\n--- Processing Image #{index+1}: {f.name} ---")

            try:
                img = Image.open(f)
                print("Opened Image")

                print("Original Mode:", img.mode)
                print("Original Size:", img.size)

                img.load()
                print("Loaded Image into Memory")

                img = ImageOps.exif_transpose(img)
                print("Applied EXIF rotation")

                # TRANSPARENCY + MODE FIX
                if img.mode == "P":
                    print("Palette Image Detected! Converting P → RGBA → RGB")
                    img = img.convert("RGBA").convert("RGB")

                elif img.mode in ("RGBA", "LA"):
                    print("Alpha Channel Detected! Removing transparency")
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1])
                    img = bg

                else:
                    print("Normal Image: Converting to RGB")
                    img = img.convert("RGB")

                print("Final Mode:", img.mode)

                # Copy image for safety
                image_list.append(img.copy())
                print("Image Added to List")

            except Exception as e:
                print("ERROR WHILE PROCESSING IMAGE:", e)
                return JsonResponse(
                    {"error": f"Image processing failed on {f.name}. Error: {str(e)}"},
                    status=500
                )

        print("\nAll images processed. Total valid images:", len(image_list))

        if not image_list:
            print("No images present!")
            return JsonResponse({"error": "No valid images"}, status=400)

        try:
            print("\n===== Creating PDF =====")
            pdf_bytes = io.BytesIO()

            image_list[0].save(
                pdf_bytes,
                format="PDF",
                resolution=100.0,
                save_all=True,
                append_images=image_list[1:]
            )

            print("PDF Saved Successfully")

            pdf_bytes.seek(0)

            print("===== SENDING PDF TO USER =====")
            return HttpResponse(
                pdf_bytes,
                content_type="application/pdf",
                headers={"Content-Disposition": 'attachment; filename="combined.pdf"'}
            )

        except Exception as e:
            print("ERROR DURING PDF CREATION:", e)
            print("===== PDF CREATION FAILED =====")
            return JsonResponse(
                {"error": f"Error generating PDF: {str(e)}"},
                status=500
            )

    print("Invalid request method")
    return JsonResponse({"error": "Invalid request"}, status=400)


import cv2
import numpy as np

def convert_to_scanned(request):
    print("\n===== START convert_to_scanned REQUEST =====")

    if request.method == "POST":
        files = request.FILES.getlist('images')
        print(f"Total files received: {len(files)}")

        processed_images_data = []

        for idx, f in enumerate(files):
            print(f"\n--- Processing Image #{idx+1}: {f.name} ---")

            try:
                # ==========================
                # 1. LOAD IMAGE
                # ==========================
                img_pil = Image.open(f)
                img_pil.load()
                print("Image loaded:", img_pil.mode, img_pil.size)

                img_pil = ImageOps.exif_transpose(img_pil)

                # Fix modes
                if img_pil.mode == "P":
                    img_pil = img_pil.convert("RGBA").convert("RGB")
                elif img_pil.mode in ("RGBA", "LA"):
                    bg = Image.new("RGB", img_pil.size, (255,255,255))
                    bg.paste(img_pil, mask=img_pil.split()[-1])
                    img_pil = bg
                else:
                    img_pil = img_pil.convert("RGB")

                print("Mode fixed:", img_pil.mode)

                # Convert PIL → OpenCV
                img = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

                # ======================================================
                # 2. SCANNING Without DESKEW (No more stretched output)
                # ======================================================

                print("Converting to grayscale...")
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

                print("Shadow removal...")
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 17))
                bg = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
                diff = 255 - cv2.absdiff(gray, bg)

                print("Enhancing contrast...")
                norm = cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX)

                print("Sharpening text...")
                sharp_kernel = np.array([[0, -1, 0],
                                         [-1, 5, -1],
                                         [0, -1, 0]])
                sharp = cv2.filter2D(norm, -1, sharp_kernel)

                print("Applying scan threshold...")
                scanned = cv2.adaptiveThreshold(
                    sharp,
                    255,
                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY,
                    35,
                    10
                )

                print("Skipping deskew — prevents stretching & wrong rotation.")

                # Convert to PIL
                scanned_pil = Image.fromarray(scanned)

                # ======================================================
                # 3. ENCODE
                # ======================================================
                img_bytes = io.BytesIO()
                scanned_pil.save(img_bytes, format="JPEG", quality=95)
                img_bytes.seek(0)

                encoded = base64.b64encode(img_bytes.read()).decode("utf-8")

                processed_images_data.append({
                    "file_name": f"Scanned-{idx+1}.jpg",
                    "base64": f"data:image/jpeg;base64,{encoded}"
                })

                print(f"Image #{idx+1} processed successfully")

            except Exception as e:
                print(f"ERROR processing {f.name}: {e}")
                return JsonResponse({"error": f"Error processing {f.name}: {str(e)}"}, status=500)

        print("\nAll images processed. Total:", len(processed_images_data))
        return JsonResponse({"images": processed_images_data})

    return JsonResponse({"error": "Invalid request"}, status=400)




from django.http import JsonResponse
from PIL import Image, ImageOps
import io
import base64

def convert_image_extension(request):
    print("\n===== START convert_image_extension REQUEST =====")

    if request.method == "POST":
        files = request.FILES.getlist("images")
        target_ext = request.POST.get("target_extension", "jpg").lower()
        print(f"Total files: {len(files)}, Target extension: {target_ext}")

        # Validate target extension
        valid_ext = ["jpg", "png", "webp", "tiff"]
        if target_ext not in valid_ext:
            return JsonResponse({"error": "Invalid target extension."}, status=400)

        processed_images = []

        for idx, f in enumerate(files):
            try:
                print(f"\n--- Processing Image #{idx+1}: {f.name} ---")
                img = Image.open(f)
                img.load()
                print("Original Mode:", img.mode, "Size:", img.size)

                # Handle palette and alpha
                if img.mode == "P":
                    img = img.convert("RGBA").convert("RGB")
                elif img.mode in ("RGBA", "LA"):
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1])
                    img = bg
                else:
                    img = img.convert("RGB")
                print("Mode after conversion:", img.mode)

                # Save to BytesIO in target format
                img_bytes = io.BytesIO()
                save_format = "JPEG" if target_ext == "jpg" else target_ext.upper()
                img.save(img_bytes, format=save_format, quality=95)
                img_bytes.seek(0)
                img_base64 = base64.b64encode(img_bytes.read()).decode("utf-8")
                processed_images.append({
                    "file_name": f"File-{idx+1}.{target_ext}",
                    "base64": f"data:image/{target_ext};base64,{img_base64}"
                })
                print(f"Image #{idx+1} converted successfully")

            except Exception as e:
                print(f"ERROR processing {f.name}: {e}")
                return JsonResponse({"error": f"Error processing {f.name}: {str(e)}"}, status=500)

        print("\nAll images converted successfully.")
        return JsonResponse({"images": processed_images})

    print("Invalid request method")
    return JsonResponse({"error": "Invalid request method"}, status=400)


import io
import zipfile
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def watermark_images(request):
    print("\n===== START add_watermark_process REQUEST =====")

    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    files = request.FILES.getlist("images")
    wm_mode = request.POST.get("watermark_mode")
    wm_text = request.POST.get("watermark_text", "")
    wm_image_file = request.FILES.get("watermark_image")

    print(f"Total Images: {len(files)} | Mode: {wm_mode}")

    processed_output = []
    zip_buffer = io.BytesIO()
    zip_file = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)

    # ---- Load watermark PNG if selected ----
    wm_png = None
    if wm_mode == "image" and wm_image_file:
        wm_png = Image.open(wm_image_file).convert("RGBA")
        print("Watermark image loaded:", wm_png.size)

    # =============== YOU CAN CHANGE OPACITY HERE =================
    TEXT_OPACITY = 140  # 0 = fully transparent, 255 = fully dark

    # If you want opacity to reduce on each image: uncomment below
    # TEXT_OPACITY = max(50, 180 - idx*10)
    # ============================================================

    for idx, f in enumerate(files):
        print(f"\n--- Processing Image #{idx+1}: {f.name} ---")

        try:
            img = Image.open(f)
            img.load()
            img = ImageOps.exif_transpose(img)

            img = img.convert("RGBA")

            # Create transparent layer for watermark
            watermark_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(watermark_layer)

            if wm_mode == "text":
                font = ImageFont.truetype("arial.ttf", 60)

                # Pillow-safe text measurement
                bbox = draw.textbbox((0, 0), wm_text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]

                # bottom-right corner
                x = img.width - text_w - 40
                y = img.height - text_h - 40

                # Draw text with opacity
                draw.text(
                    (x, y),
                    wm_text,
                    font=font,
                    fill=(255, 255, 255, TEXT_OPACITY)
                )

            else:
                print("Applying PNG watermark...")

                scale_factor = 0.25
                new_w = int(img.width * scale_factor)
                new_h = int((wm_png.height / wm_png.width) * new_w)

                wm_resized = wm_png.resize((new_w, new_h), Image.LANCZOS)

                # Apply opacity to PNG watermark
                alpha = wm_resized.split()[3]
                alpha = alpha.point(lambda p: p * 0.6)  # 0.6 = 60% visible
                wm_resized.putalpha(alpha)

                x = img.width - new_w - 40
                y = img.height - new_h - 40

                watermark_layer.paste(wm_resized, (x, y), wm_resized)

            # Merge watermark onto image
            final_img = Image.alpha_composite(img, watermark_layer)

            # Save output
            out_bytes = io.BytesIO()
            final_img.convert("RGB").save(out_bytes, format="JPEG", quality=95)
            out_bytes.seek(0)

            zip_file.writestr(f"Watermarked-{idx+1}.jpg", out_bytes.getvalue())

            encoded = base64.b64encode(out_bytes.getvalue()).decode("utf-8")
            processed_output.append({
                "file_name": f"Watermarked-{idx+1}.jpg",
                "base64": f"data:image/jpeg;base64,{encoded}"
            })

            print(f"Image #{idx+1} processed successfully.")

        except Exception as e:
            print("ERROR:", e)
            return JsonResponse({
                "error": f"Error processing {f.name}: {str(e)}"
            }, status=500)

    zip_file.close()
    zip_b64 = base64.b64encode(zip_buffer.getvalue()).decode("utf-8")

    print("\n===== ALL DONE SUCCESSFULLY =====")

    return JsonResponse({
        "images": processed_output,
        "zip_name": "Watermarked-Images.zip",
        "zip_base64": f"data:application/zip;base64,{zip_b64}"
    })
