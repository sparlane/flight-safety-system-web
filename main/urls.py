"""
Main URLs
"""

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^servers.json$', views.server_list, name='server_list'),
    url(r'^assets.json$', views.asset_list, name='asset_list'),
    url(r'^$', views.main_view, name='main_view'),
    url(r'^status/$', views.status_view, name='status_view'),
]
