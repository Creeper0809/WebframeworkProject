from django.contrib.auth.models import User
from django.db import models
from django.db.models import fields

class Category(models.TextChoices):
    ELECTRONICS = 'E', '전자기기'
    WALLET      = 'W', '지갑'
    BAG         = 'B', '가방'
    CARD        = 'C', '카드'
    CLOTHING    = 'L', '의류'
    KEY         = 'K', '열쇠'
    DOCUMENT    = 'D', '서류'
    ETC         = 'X', '기타'

class Status(models.TextChoices):
    LOST = 'LOST', '분실'
    FOUND = 'FOUND', '습득'
    RETURNED = 'RETURNED', '반환'

class LostItem(models.Model):
    id = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField()
    user_id = models.ForeignKey(User, on_delete=models.CASCADE,related_name='lost_items')
    category = models.CharField(
        max_length=2,
        choices=Category.choices,
        default=Category.ETC
    )
    status = models.CharField(
        max_length=8,
        choices=Status.choices,
        default=Status.LOST
    )

class Comment(models.Model):
    lost_item = models.ForeignKey(LostItem, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    def is_reply(self):
        return self.parent is not None

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"
