from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import SignInLog
from django.utils import timezone

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone_number', 'picture', 'role', 'is_active', 'last_signin', 'avg_signin']
        read_only_fields = ['id', 'last_signin', 'avg_signin']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'pin', 'picture', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            pin=validated_data.get('pin', ''),
            picture=validated_data.get('picture', ''),
            role=validated_data.get('role', 'user')
        )
        return user

class MyTokenObtainPairSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username_or_email')
        password = attrs.get('password')

        user = User.objects.filter(username=username_or_email).first()
        if not user:
            user = User.objects.filter(email=username_or_email).first()

        if not user:
            raise serializers.ValidationError({
                'error': 'user_not_found',
                'message': 'No account found with this username or email.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'error': 'account_disabled',
                'message': 'This account has been deactivated. Contact your administrator.'
            })

        if not user.check_password(password):
            raise serializers.ValidationError({
                'error': 'wrong_password',
                'message': 'Incorrect password. Please try again.'
            })

        user.last_signin = timezone.now()
        user.save()
        SignInLog.objects.create(user=user)
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }

class PINLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    pin = serializers.CharField()

    def validate(self, attrs):
        username_or_email = attrs.get('username_or_email')
        pin = attrs.get('pin')

        user = User.objects.filter(username=username_or_email).first()
        if not user:
            user = User.objects.filter(email=username_or_email).first()

        if not user:
            raise serializers.ValidationError({
                'error': 'user_not_found',
                'message': 'No account found with this username or email.'
            })

        if not user.is_active:
            raise serializers.ValidationError({
                'error': 'account_disabled',
                'message': 'This account has been deactivated. Contact your administrator.'
            })

        if not user.pin or user.pin != pin:
            raise serializers.ValidationError({
                'error': 'wrong_pin',
                'message': 'Incorrect PIN. Please try again.'
            })

        user.last_signin = timezone.now()
        user.save()
        SignInLog.objects.create(user=user)
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }
