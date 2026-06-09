from django.contrib import admin
from .models import Usuario, Diagnostico, Auditoria

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('identificacion', 'first_name', 'last_name', 'rol', 'email', 'is_active')
    list_filter = ('rol', 'is_active', 'sexo')
    search_fields = ('identificacion', 'first_name', 'last_name', 'email')
    readonly_fields = ('fecha_creacion', 'last_login')
    fieldsets = (
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'identificacion', 'telefono', 'sexo', 'email')
        }),
        ('Ubicación', {
            'fields': ('pais', 'departamento', 'ciudad')
        }),
        ('Roles y Permisos', {
            'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'last_login', 'date_joined')
        }),
    )

@admin.register(Diagnostico)
class DiagnosticoAdmin(admin.ModelAdmin):
    list_display = ('id', 'paciente', 'clase', 'categoria', 'confianza', 'fecha')
    list_filter = ('categoria', 'clase', 'fecha')
    search_fields = ('paciente__identificacion', 'paciente__first_name', 'paciente__last_name', 'clase')
    readonly_fields = ('fecha', 'probabilidades', 'imagen')
    fieldsets = (
        ('Paciente', {
            'fields': ('paciente',)
        }),
        ('Resultado del Diagnóstico', {
            'fields': ('clase', 'categoria', 'confianza', 'codigo_cie10')
        }),
        ('Datos Técnicos', {
            'fields': ('probabilidades', 'imagen', 'fecha')
        }),
    )

@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = ('accion', 'usuario', 'fecha')
    list_filter = ('accion', 'fecha')
    search_fields = ('usuario__identificacion', 'usuario__first_name', 'accion')
    readonly_fields = ('accion', 'usuario', 'fecha', 'detalles')