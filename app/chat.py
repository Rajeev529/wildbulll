from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
arr=[]
# If you are using standard Django forms, remove @csrf_exempt 
# and use the CSRF token in your JS.
@csrf_exempt 
def process_text_view(request):
    if request.method == 'POST':
        # 1. Get the input from user
        user_input = request.POST.get('input_text', '')
        arr.append(user_input)
        # 2. Your logic goes here (placeholder)
        # example: processed_data = user_input.upper() 
        output_text = "https://r.swiggy.com/decorate-xmas-tree/ydeHi7-hYhN1Hjxgb3" 

        # 3. Return the JSON response
        return JsonResponse({
            'status': 'success',
            'output_text': output_text,
            'received_input': user_input
        })
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)