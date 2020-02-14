"""
App definition for config
"""
from django.apps import AppConfig


class ConfigConfig(AppConfig):
    """
    Define the Config App
    """
    name = 'config'

    def ready(self):
        from config import handlers
