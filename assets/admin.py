"""
Make assets editable in the admin interface
"""

from django.contrib import admin

from .models import Asset

admin.site.register(Asset)
