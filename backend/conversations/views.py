from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, Count, Q
from .models import Conversation, Message, MessageReceipt
from .serializers import ConversationListSerializer, ConversationDetailSerializer, MessageSerializer, UserShortSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationDetailSerializer

    def create(self, request, *args, **kwargs):
        # Determine 1-on-1 or group
        participant_ids = request.data.get('participants', [])
        if not isinstance(participant_ids, list):
            return Response({"detail": "participants must be a list of user IDs."}, status=status.HTTP_400_BAD_REQUEST)
        
        participant_ids.append(request.user.id)
        # Unique valid IDs
        valid_ids = list(set([pid for pid in participant_ids if User.objects.filter(id=pid).exists()]))

        if len(valid_ids) < 2:
            return Response({"detail": "Need at least 2 valid participants."}, status=status.HTTP_400_BAD_REQUEST)

        is_group = len(valid_ids) > 2

        if not is_group:
            # Check if 1-on-1 already exists
            existing_cv = Conversation.objects.filter(is_group=False).annotate(p_count=Count('participants')).filter(p_count=2)
            for valid_id in valid_ids:
                existing_cv = existing_cv.filter(participants__id=valid_id)
            
            if existing_cv.exists():
                serializer = self.get_serializer(existing_cv.first())
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Create new
        name = request.data.get('name', '') if is_group else None
        conversation = Conversation.objects.create(is_group=is_group, name=name)
        conversation.participants.set(valid_ids)

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        messages = conversation.messages.select_related('sender').prefetch_related('receipts').order_by('-created_at')[:limit]
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        unread_receipts = MessageReceipt.objects.filter(
            message__conversation=conversation,
            user=request.user,
            is_read=False
        )
        unread_receipts.update(is_read=True, read_at=timezone.now())
        return Response({"status": "success"})


from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from notifications.models import Notification

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(conversation__participants=self.request.user)

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        # Create receipts for all other participants
        receipts = []
        for participant in msg.conversation.participants.all():
            if participant != self.request.user:
                receipts.append(MessageReceipt(message=msg, user=participant, is_read=False))
        MessageReceipt.objects.bulk_create(receipts)
        
        # update conversation updated_at
        msg.conversation.save()

        # --- Create Notifications for other participants ---
        sender_name = f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.email
        content_preview = (msg.content or '')[:80]
        if msg.voice_note:
            content_preview = '🎤 Voice note'
        elif msg.attachment:
            content_preview = '📎 Attachment'
        elif not content_preview:
            content_preview = 'New message'

        for participant in msg.conversation.participants.all():
            if participant != self.request.user:
                Notification.objects.create(
                    user=participant,
                    type='message',
                    title=f"New message from {sender_name}",
                    message=content_preview,
                    related_link=f"/dashboard/chat",
                )
                # Push real-time notification via WebSocket
                unread = Notification.objects.filter(user=participant, is_read=False).count()
                async_to_sync(channel_layer.group_send)(
                    f'notify_user_{participant.id}',
                    {
                        'type': 'notify_update',
                        'count': unread,
                        'title': f"New message from {sender_name}",
                        'message': content_preview,
                    }
                )

        # Broadcast over WebSockets
        channel_layer = get_channel_layer()
        serialized_msg = self.get_serializer(msg, context={'request': self.request}).data
        async_to_sync(channel_layer.group_send)(
            f'chat_{msg.conversation.id}',
            {
                'type': 'chat_message',
                **serialized_msg
            }
        )

class UsersListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserShortSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Exclude self
        return self.queryset.exclude(id=self.request.user.id)
