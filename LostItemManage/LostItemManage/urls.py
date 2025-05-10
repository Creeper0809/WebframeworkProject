from django.contrib import admin
from django.urls import path, include
from core.views import home

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('account/', include('account.urls')),
    path('item/', include('item.urls')),      # ← 반드시 'item/' 로 include
]
