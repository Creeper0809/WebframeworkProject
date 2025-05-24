import os

from django.http import JsonResponse, HttpResponseNotFound
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.forms.models import model_to_dict
from django.db.models import Prefetch

from .models import LostItem, Comment
import json

def serialize_comment(comment):
    return {
        'id': comment.id,
        'user': comment.user_id.username,
        'content': comment.content,
        'created_at': comment.created_at.isoformat(),
        'parent': comment.parent.id if comment.parent else -1,
        'replies': [
            {
                'id': reply.id,
                'user': reply.user_id.username,
                'content': reply.content,
                'created_at': reply.created_at.isoformat(),
                'parent': reply.parent.id if reply.parent else -1
            }
            for reply in comment.replies.all()
        ]
    }

@method_decorator(csrf_exempt, name='dispatch')
class LostItemListView(View):
    def get(self, request):
        items = LostItem.objects.all().order_by('-created_at')
        result = []
        for item in items:
            result.append({
                'id':          item.id,
                'title':       item.title,
                'description': item.description,
                'latitude':    item.latitude,
                'longitude':   item.longitude,
                'category':    item.get_category_display(),
                'status':      item.get_status_display(),
                'image_url':   item.image.url if item.image else None,
                'user':        item.user.username,
                'created_at':  item.created_at.isoformat(),
            })
        return JsonResponse(result, safe=False)

    def post(self, request):
        # 1) 반드시 받아야 할 필드 검증
        title = request.POST.get('title')
        if not title:
            return JsonResponse({'error': '제목을 입력해주세요.'}, status=400)

        # 2) 나머지 필드
        description = request.POST.get('description', '')
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')

        # 3) 이미지 파일 검증 (선택 사항)
        img = request.FILES.get('image')
        if img:
            ext = os.path.splitext(img.name)[1].lower()
            if ext not in ['.jpg', '.png']:
                return JsonResponse(
                    {'error': '이미지는 .jpg 혹은 .png만 업로드 가능합니다.'},
                    status=400
                )

        # 4) DB에 저장
        item = LostItem.objects.create(
            title=title,
            description=description,
            latitude=latitude,
            longitude=longitude,
            user=request.user,
            created_at=timezone.now(),
            image=img
        )
        return JsonResponse({'id': item.id}, status=201)

@method_decorator(csrf_exempt, name='dispatch')
class LostItemDetailView(View):
    def get(self, request, id):
        try:
            item = LostItem.objects.prefetch_related(
                Prefetch('comments', queryset=Comment.objects.filter(parent__isnull=True)
                         .prefetch_related('replies', 'user_id'))
            ).get(id=id)

            item_dict = model_to_dict(item)
            item_dict.pop('image', None)
            item_dict['image_url'] = item.image.url if item.image else None
            item_dict['user_id'] = item.user.id if item.user else None
            item_dict['comments'] = [serialize_comment(c) for c in item.comments.all()]
            item_dict["created_at"] = item.created_at.isoformat()[:-6] + "Z"
            return JsonResponse(item_dict)
        except LostItem.DoesNotExist:
            return HttpResponseNotFound('Item not found')

    def delete(self, request, id):
        try:
            item = LostItem.objects.get(id=id)
            item.delete()
            return JsonResponse({'message': 'Item deleted'})
        except LostItem.DoesNotExist:
            return HttpResponseNotFound('Item not found')

    def patch(self, request, id):
        try:
            item = LostItem.objects.get(id=id)
            if item.user != request.user:
                return JsonResponse({'error': '수정 권한이 없습니다.'}, status=403)

            data = json.loads(request.body)
            title = data.get('title')
            description = data.get('description')
            status = data.get('status')

            if title is not None:
                item.title = title
            if description is not None:
                item.description = description
            if status in ['LOST', 'FOUND', 'RETURNED']:
                item.status = status

            item.save()

            return JsonResponse({
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'status': item.status,
            })
        except LostItem.DoesNotExist:
            return JsonResponse({'error': 'Item not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class CommentCreateView(View):
    def post(self, request, id):
        if not request.user.is_authenticated:
            return JsonResponse({'error': '로그인 필요'}, status=403)

        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
            parent_id = data.get('parent')
            if not content:
                return JsonResponse({'error': '내용이 비어있습니다'}, status=400)
            lost_item = LostItem.objects.get(id=id)
            parent = Comment.objects.filter(id=parent_id).first() if parent_id and int(parent_id) != -1 else None
            comment = Comment.objects.create(
                lost_item=lost_item,
                user_id=request.user,
                content=content,
                parent=parent
            )
            return JsonResponse({
                'id': comment.id,
                'user': comment.user_id.username,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'parent': parent.id if parent else -1,
                'replies': []
            }, status=201)

        except LostItem.DoesNotExist:
            return JsonResponse({'error': '유실물이 존재하지 않습니다.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
