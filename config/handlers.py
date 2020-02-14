"""
Custom handler
"""
from corsheaders.signals import check_request_enabled

from .models import ServerConfig


def cors_allow_configured_sites(sender, request, **kwargs):
    """
    Allow cross-site requests from hosts in the database
    """
    host = request.headers['host']
    if ':' in host:
        address, port = host.split(':', 1)
    return ServerConfig.objects.filter(address=address, config_port=port).exists()


check_request_enabled.connect(cors_allow_configured_sites)
