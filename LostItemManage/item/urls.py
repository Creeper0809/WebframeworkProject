from django.urls import path
from .views import LostItemListView, LostItemDetailView, CommentCreateView

app_name = 'item'

urlpatterns = [
    path('', LostItemListView.as_view(), name='item-list'),
    path('<int:id>/', LostItemDetailView.as_view(), name='item-detail'),
    path('<int:id>/comment/', CommentCreateView.as_view(), name='add-comment'),
]
