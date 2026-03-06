import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Each authenticated user joins their own notification group (notify_user_<id>).
    When a notification is created, the server pushes the unread count to the user
    instead of the client having to poll every 30 seconds.
    """

    async def connect(self):
        self.user = self.scope.get('user')
        if self.user and self.user.is_authenticated:
            self.group_name = f'notify_user_{self.user.id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            # Send current unread count on connect
            count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': count
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify_update(self, event):
        """Called when a notification is created — pushes new count to the client."""
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': event['count'],
            'title': event.get('title', ''),
            'message': event.get('message', ''),
        }))

    @database_sync_to_async
    def get_unread_count(self):
        from notifications.models import Notification
        return Notification.objects.filter(user=self.user, is_read=False).count()
