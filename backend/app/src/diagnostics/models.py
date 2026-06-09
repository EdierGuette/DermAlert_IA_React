from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import json

class Usuario(AbstractUser):
    ROLES = (
        ('paciente', 'Paciente'),
        ('medico', 'Médico'),
        ('administrador', 'Administrador'),
    )
    
    SEXOS = (
        ('masculino', 'Masculino'),
        ('femenino', 'Femenino'),
        ('otro', 'Otro'),
    )

    identificacion = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=15)
    sexo = models.CharField(max_length=10, choices=SEXOS)
    rol = models.CharField(max_length=15, choices=ROLES, default='paciente')
    fecha_creacion = models.DateTimeField(default=timezone.now)

    # Campos de ubicación
    pais = models.CharField(max_length=100, default='Colombia')
    departamento = models.CharField(max_length=100, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.identificacion})"


class Diagnostico(models.Model):
    # Clases específicas (9 clases)
    CLASES = (
        ('Benigno General', 'Benigno General'),
        ('Nevo Lunar', 'Nevo Lunar'),
        ('Dermatofibroma', 'Dermatofibroma'),
        ('Queratosis Seborreica', 'Queratosis Seborreica'),
        ('Melanoma', 'Melanoma'),
        ('Carcinoma Basocelular', 'Carcinoma Basocelular'),
        ('Carcinoma Escamocelular', 'Carcinoma Escamocelular'),
        ('Premaligno', 'Premaligno'),
        ('Desconocido', 'Desconocido'),
    )
    
    # Categorías generales para agrupación
    CATEGORIAS = (
        ('Maligno', 'Maligno'),
        ('Benigno', 'Benigno'),
        ('Premaligno', 'Premaligno'),
        ('Desconocido', 'Desconocido'),
    )

    paciente = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='diagnosticos')
    fecha = models.DateTimeField(default=timezone.now)
    clase = models.CharField(max_length=30, choices=CLASES)
    categoria = models.CharField(max_length=15, choices=CATEGORIAS, default='Desconocido')
    confianza = models.FloatField()
    probabilidades = models.JSONField()
    imagen = models.TextField()
    
    # Código CIE-10
    codigo_cie10 = models.CharField(max_length=10, blank=True, null=True, help_text="Código CIE-10 de la lesión")

    def __str__(self):
        return f"Diagnóstico {self.id} - {self.paciente} - {self.clase} ({self.categoria}) - CIE-10: {self.codigo_cie10}"


class Auditoria(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=255)
    fecha = models.DateTimeField(default=timezone.now)
    detalles = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.accion} - {self.usuario} - {self.fecha}"