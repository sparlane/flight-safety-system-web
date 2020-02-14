"""
Views to configure servers and assets.
"""
from django.shortcuts import render

from assets.models import Asset
from .models import ServerConfig, SMMConfig, AssetConfig


def config_main(request):
    """
    Main configuration page
    """
    assets = Asset.objects.all()

    for asset in assets:
        asset.config = AssetConfig.objects.get(asset=asset)

    data = {
        'FSSservers': ServerConfig.objects.all(),
        'SMMservers': SMMConfig.objects.all(),
        'Assets': assets,
    }
    return render(request, 'config/main.html', data)
