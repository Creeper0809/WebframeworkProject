from django.http import JsonResponse, HttpResponseNotFound
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.forms.models import model_to_dict
from django.contrib.auth.models import User
from django.db.models import Prefetch

from .models import LostItem, Comment
import json

def serialize_comment(comment):
    return {
        'id': comment.id,
        'user': comment.user.username,
        'content': comment.content,
        'created_at': comment.created_at.isoformat(),
        'parent': comment.parent.id if comment.parent else -1,  # ← 요거 추가!
        'replies': [
            {
                'id': reply.id,
                'user': reply.user.username,
                'content': reply.content,
                'created_at': reply.created_at.isoformat(),
                'parent': reply.parent.id if reply.parent else -1  # ← 여기도!
            }
            for reply in comment.replies.all()
        ]
    }


@method_decorator(csrf_exempt, name='dispatch')
class LostItemListView(View):
    def get(self, request):
        items = LostItem.objects.prefetch_related(
            Prefetch('comments', queryset=Comment.objects.filter(parent__isnull=True).prefetch_related('replies', 'user'))
        ).all()

        result = []
        for item in items:
            item_dict = model_to_dict(item)
            item_dict['user_id'] = item.user_id.id if item.user_id else None
            item_dict['comments'] = [serialize_comment(c) for c in item.comments.all()]
            result.append(item_dict)

        return JsonResponse(result, safe=False)

    def post(self, request):
        try:
            data = json.loads(request.body)
            item = LostItem.objects.create(
                title=data.get('title'),
                description=data.get('description', ''),
                latitude=data.get('latitude'),
                longitude=data.get('longitude'),
                user_id=request.user,
                created_at=timezone.now(),
            )
            return JsonResponse({'id': item.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class LostItemDetailView(View):
    def get(self, request, id):
        try:
            item = LostItem.objects.prefetch_related(
                Prefetch('comments', queryset=Comment.objects.filter(parent__isnull=True).prefetch_related('replies', 'user'))
            ).get(id=id)

            item_dict = model_to_dict(item)
            item_dict['user_id'] = item.user_id.id if item.user_id else None
            item_dict['comments'] = [serialize_comment(c) for c in item.comments.all()]

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
            if item.user_id != request.user:
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
            print("as2d")
            lost_item = LostItem.objects.get(id=id)
            parent = Comment.objects.filter(id=parent_id).first() if parent_id else None
            comment = Comment.objects.create(
                lost_item=lost_item,
                user=request.user,
                content=content,
                parent=parent
            )
            print("as2d")
            return JsonResponse({
                'id': comment.id,
                'user': comment.user.username,
                'content': comment.content,
                'created_at': comment.created_at.isoformat(),
                'parent_id': parent.id if parent else None
            }, status=201)

        except LostItem.DoesNotExist:
            return JsonResponse({'error': '유실물이 존재하지 않습니다.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
