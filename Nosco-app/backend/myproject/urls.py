from django.urls import path, include

urlpatterns = [
    # ... other urls
    path('api/', include('worker_app.urls')),
]