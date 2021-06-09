"""
Make config editable in the admin interface
"""

from django.contrib import admin

from .models import AssetConfig, ServerConfig, SMMConfig

admin.site.register(ServerConfig)
admin.site.register(SMMConfig)
admin.site.register(AssetConfig)
