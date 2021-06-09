"""
URLs for configuration
"""

from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.config_main, name='config_main'),
]
