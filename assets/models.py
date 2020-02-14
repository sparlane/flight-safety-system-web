"""
Database models for Assets and associated data
"""

from django.contrib.gis.db import models
from django.utils import timezone


class Asset(models.Model):
    """
    An asset
    """
    name = models.CharField(max_length=100)

    def __str__(self):
        return "Asset: {}".format(self.name)

    class Meta:
        indexes = [
            models.Index(fields=['name', ]),
        ]


class AssetSearchProgress(models.Model):
    """
    A report of how far thru a search an asset is
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    search = models.IntegerField()
    search_progress = models.IntegerField()
    search_progress_of = models.IntegerField()

    def __str__(self):
        return "{} performing search {} @ {} of {}".format(self.asset, self.search, self.search_progress, self.search_progress_of)

    class Meta:
        indexes = [
            models.Index(fields=['asset', 'timestamp', ]),
        ]


class AssetStatus(models.Model):
    """
    Last reported (health) status of an asset
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    bat_percent = models.IntegerField()
    bat_used_mah = models.IntegerField()

    def __str__(self):
        return "{} with {}% battery remaining ({}mAh used)".format(self.asset, self.bat_percent, self.bat_used_mah)

    class Meta:
        indexes = [
            models.Index(fields=['asset', 'timestamp', ]),
        ]


class AssetPosition(models.Model):
    """
    Last reported position of an asset
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    position = models.PointField(geography=True)
    altitude = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['asset', 'timestamp', ]),
        ]


class AssetRTT(models.Model):
    """
    Last reported RTT of asset
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(default=timezone.now)
    rtt = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=['asset', 'timestamp', ]),
        ]
