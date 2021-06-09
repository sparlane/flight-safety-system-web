"""
URLs for assets
"""

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.assets_main, name='assets_main'),
    url(r'^add/$', views.asset_add, name='asset_add'),
    url(r'^(?P<asset_id>\d+)/status.json$', views.asset_status_json, name='asset_status_json'),
    url(r'^(?P<asset_id>\d+)/command/set/$', views.asset_command_set, name='asset_command_set'),
]
