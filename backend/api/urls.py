from django.urls import path
from .views import scan_code

urlpatterns = [
    path('scan/', scan_code),
]