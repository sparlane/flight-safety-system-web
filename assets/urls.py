"""
URLs for assets
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.assets_main, name='assets_main'),
    url(r'^(?P<asset_id>\d+)/status.json$', views.asset_status_json, name='asset_status_json'),
]
