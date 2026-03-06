from rest_framework import serializers
from .models import Plan, PlanItem


class PlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanItem
        fields = '__all__'
        read_only_fields = ['created_at']


class PlanSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_owner_name(self, obj):
        if obj.owner:
            full_name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
            return full_name or obj.owner.username
        return None

    def get_items_count(self, obj):
        return obj.items.count()


class PlanDetailSerializer(PlanSerializer):
    items = PlanItemSerializer(many=True, read_only=True)

    class Meta(PlanSerializer.Meta):
        fields = '__all__'
