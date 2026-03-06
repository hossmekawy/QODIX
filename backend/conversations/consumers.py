import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Expected URL route: ws/chat/<conversation_id>/
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # TODO: Add authentication checks utilizing JWT from scope later
        # Currently blindly accepting for scaffolding
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Frontend)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json.get('message')
        sender_id = text_data_json.get('sender_id')

        # Save message to DB asynchronously
        message = await self.save_message(sender_id, self.conversation_id, message_content)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_content,
                'sender_id': sender_id,
                'message_id': message.id,
                'created_at': message.created_at.isoformat()
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send full serialized message to WebSocket
        # event contains 'type': 'chat_message', plus the serializer fields
        message_data = {k: v for k, v in event.items() if k != 'type'}
        await self.send(text_data=json.dumps(message_data))

    @database_sync_to_async
    def save_message(self, sender_id, conversation_id, content):
        user = User.objects.get(id=sender_id)
        conv = Conversation.objects.get(id=conversation_id)
        msg = Message.objects.create(sender=user, conversation=conv, content=content)
        conv.save() # trigger updated_at
        return msg
