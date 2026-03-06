from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Plan, PlanItem
from .serializers import PlanSerializer, PlanDetailSerializer, PlanItemSerializer


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlanDetailSerializer
        return PlanSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        queryset = Plan.objects.all()
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        plan_type = self.request.query_params.get('plan_type')
        search = self.request.query_params.get('search')

        if category:
            queryset = queryset.filter(category=category)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['patch'])
    def save_board(self, request, pk=None):
        """Save the tldraw canvas JSON state."""
        plan = self.get_object()
        board_state = request.data.get('board_state')
        if board_state is not None:
            plan.board_state = board_state
            plan.save(update_fields=['board_state', 'updated_at'])
        return Response({'status': 'saved'})


class PlanItemViewSet(viewsets.ModelViewSet):
    queryset = PlanItem.objects.all()
    serializer_class = PlanItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = PlanItem.objects.all()
        plan_id = self.request.query_params.get('plan')
        item_type = self.request.query_params.get('item_type')
        if plan_id:
            queryset = queryset.filter(plan_id=plan_id)
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        return queryset
