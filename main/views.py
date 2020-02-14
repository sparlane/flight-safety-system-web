"""
Main view functions
"""
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse

from config.models import ServerConfig
from assets.models import Asset


def main_view(request):
    """
    The default landing page
    """
    data = {}
    return render(request, 'main/main.html', data)


def status_view(request):
    """
    Report the current status
    """
    assets = Asset.objects.all()
    return HttpResponse('<tr><td class="server-status-label">Known Assets</td><td class="server-status-value">{}</td></tr>'.format(assets.count()))


def server_list(request):
    """
    Return the active servers as a json array
    """
    servers = ServerConfig.objects.filter(active=True)
    servers_list = []
    for server in servers:
        servers_list.append({'name': server.name, 'address': server.address, 'client_port': server.client_port, 'url': server.http_address()})

    return JsonResponse({'servers': servers_list})


def asset_list(request):
    """
    Return the know assets as a json array
    """
    assets = Asset.objects.filter()
    assets_list = []
    for asset in assets:
        assets_list.append({'pk': asset.pk, 'name': asset.name})

    return JsonResponse({'assets': assets_list})
