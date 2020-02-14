"""
Views for Assets
"""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from .models import Asset, AssetStatus, AssetSearchProgress, AssetPosition


def assets_main(request):
    """
    Show the current asset list
    """
    data = {
        'assets': Asset.objects.all(),
    }
    return render(request, 'assets/main.html', data)


def asset_status_json(request, asset_id):
    """
    Show the current asset status
    """
    asset = get_object_or_404(Asset, pk=asset_id)
    data = {
        'asset': {'name': asset.name}
    }

    try:
        position = AssetPosition.objects.filter(asset=asset).latest('timestamp')
        data['position'] = {
            'timestamp': position.timestamp,
            'lat': position.position.y,
            'lng': position.position.x,
        }
    except ObjectDoesNotExist:
        pass
    try:
        status = AssetStatus.objects.filter(asset=asset).latest('timestamp')
        data['status'] = {
            'timestamp': status.timestamp,
            'battery_percent': status.bat_percent,
            'battery_used': status.bat_used_mah,
        }
    except ObjectDoesNotExist:
        pass
    try:
        search = AssetSearchProgress.objects.filter(asset=asset).latest('timestamp')
        data['search'] = {
            'timestamp': search.timestamp,
            'id': search.search,
            'progress': search.search_progress,
            'total': search.search_progress_of,
        }
    except ObjectDoesNotExist:
        pass

    return JsonResponse(data)
