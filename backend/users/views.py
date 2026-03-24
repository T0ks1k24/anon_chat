from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import RegisterSerializer, LoginSerializer
from .services import login_user
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = login_user(
            serializer.validated_data["username"],
            serializer.validated_data["password"]
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_200_OK)
