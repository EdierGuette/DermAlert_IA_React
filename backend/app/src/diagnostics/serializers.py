from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Diagnostico

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ('id', 'username', 'first_name', 'last_name', 'identificacion',
                  'telefono', 'sexo', 'departamento', 'ciudad', 'pais',
                  'password', 'password_confirm')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        validated_data['rol'] = 'paciente'
        validated_data['email'] = ''
        if 'pais' not in validated_data:
            validated_data['pais'] = 'Colombia'
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    identificacion = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        identificacion = data.get('identificacion')
        password = data.get('password')
        if identificacion and password:
            try:
                user = Usuario.objects.get(identificacion=identificacion)
                if user.check_password(password):
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError('Credenciales inválidas')
            except Usuario.DoesNotExist:
                raise serializers.ValidationError('Credenciales inválidas')
        else:
            raise serializers.ValidationError('Debe proporcionar identificación y contraseña')


class DiagnosticoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='paciente.get_full_name', read_only=True)
    paciente_identificacion = serializers.CharField(source='paciente.identificacion', read_only=True)

    class Meta:
        model = Diagnostico
        fields = ('id', 'paciente', 'paciente_nombre', 'paciente_identificacion',
                  'fecha', 'clase', 'categoria', 'confianza', 'probabilidades', 
                  'imagen', 'codigo_cie10')
        read_only_fields = ('id', 'fecha')