"""
Make config editable in the admin interface
"""

from django.contrib import admin

from .models import ServerConfig, SMMConfig, AssetConfig

admin.site.register(ServerConfig)
admin.site.register(SMMConfig)
admin.site.register(AssetConfig)
