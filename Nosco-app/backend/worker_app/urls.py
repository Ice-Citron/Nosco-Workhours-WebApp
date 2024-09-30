from django.urls import path
from . import views

urlpatterns = [
    path('calculate_factorial/', views.calculate_factorial, name='calculate_factorial'),
]