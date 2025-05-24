from django.contrib import admin
from django.urls import path, include
from core.views import home
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('account/', include('account.urls')),
    path('item/', include('item.urls')),      # ← 반드시 'item/' 로 include
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
