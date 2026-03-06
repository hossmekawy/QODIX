from rest_framework import serializers
from .models import Conversation, Message, MessageReceipt
from django.contrib.auth import get_user_model

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'picture']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'attachment', 'voice_note', 'created_at', 'is_read']
        read_only_fields = ['id', 'created_at']

    def get_is_read(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        receipt = obj.receipts.filter(user=request.user).first()
        return receipt.is_read if receipt else False

class ConversationListSerializer(serializers.ModelSerializer):
    participants = UserShortSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'name', 'is_group', 'participants', 'created_at', 'updated_at', 'last_message', 'unread_count']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(receipts__user=request.user, receipts__is_read=False).count()

class ConversationDetailSerializer(serializers.ModelSerializer):
    participants = UserShortSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'name', 'is_group', 'participants', 'created_at']
