from django.http import JsonResponse

def calculate_factorial(request):
    number = int(request.GET.get('number', 0))
    result = 1
    for i in range(1, number + 1):
        result *= i
    return JsonResponse({'result': result})