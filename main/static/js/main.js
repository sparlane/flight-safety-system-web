var known_servers = [];
var known_assets = [];

/* definitions */
const asset_position_time_warn = 30 * 1000;
const asset_position_time_old = 60 * 1000;

const battery_critical = 20;
const battery_warn = 50;
const battery_time_warn = 60 * 1000;
const battery_time_old = 120 * 1000;

const search_time_warn = 300 * 1000;
const search_time_old = 600 * 1000;

function deg_to_dm(degs, lat)
{
    var dir = '';
    if (degs < 0)
    {
        degs = degs * -1;
        dir = lat ? 'S' : 'W';
    }
    else
    {
        dir = lat ? 'N' : 'E';
    }
    var d = Math.floor(degs);
    var mins = ((degs-d)*60).toFixed(3);

    return d + ' ' + mins + ' ' + dir;
}

serverFind = function(name)
{
    for (var ks in known_servers)
    {
        if (known_servers[ks].name === name)
        {
            return known_servers[ks];
        }
    }
    return null;
}

serverAddIfNew = function(server)
{
    var existing = serverFind(server.name);
    if (existing === null)
    {
        known_servers.push(server);
        /* Present new server */
        $("div#servers").append('<div class="server" id="server_' + server.name + '"><div id="server_label_' + server.name + '" class="server-label">' + server.name + '</div><table id="server_status_' + server.name + '" class="server-status"><tr><td>Connecting</td></tr></table></div>');
    }
}

assetFind = function(name)
{
    for (var ka in known_assets)
    {
        if (known_assets[ka].name === name)
        {
            return known_assets[ka];
        }
    }
    return null;
}

assetAddIfNew = function(asset)
{
    var existing = assetFind(asset.name);
    if (existing === null)
    {
        asset.servers = [];
        asset.serverFind = function(name)
        {
            for (var s in asset.servers)
            {
                if (asset.servers[s].server.name === name)
                {
                    return asset.servers[s];
                }
            }
            return null;
        }
        known_assets.push(asset);
        
        $("div#assets").append('<div class="asset" id="asset_' + asset.name + '"><div class="asset-label" id="asset_label_' + asset.name + '">' + asset.name + '</div><div class="asset-status" id="asset_status_' + asset.name + '"></div></div>');
    }
}

assetServerAddIfNew = function(name, server, server_asset_id)
{
    var asset = assetFind(name);
    if (asset !== null)
    {
        server_entry = asset.serverFind(server.name);
        if (server_entry === null)
        {
            id_prefix = 'asset_status_' + asset.name + '_server_' + server.name;
            asset.servers.push({server: server, pk: server_asset_id, id_prefix: id_prefix});
            html = '<div class="asset-status-server" id="' + id_prefix + '">';
            html += '<div class="asset-status-server-label">' + server.name + '</div>';
            html += '<div class="asset-position" id="' + id_prefix + '_position">Waiting for position ...</div>';
            html += '<table class="asset-battery-status" id="' + id_prefix + '_battery">';
            html += '<tr><td>Remaining %</td><td>Used (mAh)</td></tr>';
            html += '<tr><td id="' + id_prefix + '_battery_remaining">Unknown</td><td id="' + id_prefix + '_battery_used">Unknown</td></tr>';
            html += '</table>';
            html += '<table class="asset-search-status" id="' + id_prefix + '_search">';
            html += '<tr><td>Search</td><td>Completed</td><td>Total</td></tr>';
            html += '<tr><td id="' + id_prefix + '_search_id">Unknown</td><td id="' + id_prefix + '_search_current">Unknown</td><td id="' + id_prefix + '_search_total">Unknown</td></tr>';
            html += '</table>';
            html += '</div>';
            $("#asset_status_" + asset.name).append(html);
        }
    }
}

fieldMarkOld = function(field, timestamp, old, warn, prefix)
{
    var dbTime = new Date(timestamp);
    var curTime = new Date();
    var timeDelata = curTime.getTime() - (new Date()).getTime();
    if (curTime.getTime() - dbTime.getTime() > old)
    {
        $(field).addClass(prefix + "-old");
    }
    else if (curTime.getTime() - dbTime.getTime() > warn)
    {
        $(field).addClass(prefix + "-warn");
    }
    else
    {
        $(field).removeClass(prefix + "-old");
        $(field).removeClass(prefix + "-warn");
    }
}

assetServerPopulateStatus = function(asset, server_entry, data)
{
    if ('position' in data)
    {
        $("#" + server_entry.id_prefix + "_position").html(deg_to_dm(data.position.lat, true) + ' ' + deg_to_dm(data.position.lng, false));
        fieldMarkOld("#" + server_entry.id_prefix + "_position", data.position.timestamp, asset_position_time_old, asset_position_time_warn, "asset-position");
    }
    if ('status' in data)
    {
        $("#" + server_entry.id_prefix + "_battery_remaining").html(data['status']['battery_percent']);
        $("#" + server_entry.id_prefix + "_battery_used").html(data['status']['battery_used']);
        if (data['status']['battery_percent'] < battery_critical)
        {
            $("#" + server_entry.id_prefix + "_battery").addClass("asset-battery-critical");
        }
        else if(data['status']['battery_percent'] < battery_warn)
        {
            $("#" + server_entry.id_prefix + "_battery").addClass("asset-battery-warn");
        }
        fieldMarkOld("#" + server_entry.id_prefix + "_battery", data.status.timestamp, battery_time_old, battery_time_warn, "asset-battery-time");
    }
    if ('search' in data)
    {
        $("#" + server_entry.id_prefix + "_search_id").html(data['search']['id']);
        $("#" + server_entry.id_prefix + "_search_current").html(data['search']['progress']);
        $("#" + server_entry.id_prefix + "_search_total").html(data['search']['total']);
        fieldMarkOld("#" + server_entry.id_prefix + "_search", data.search.timestamp, search_time_old, search_time_warn, "asset-search-time");
    }
}

assetServerUpdateStatus = function(name, server)
{
    var asset = assetFind(name);
    if (asset === null)
    {
        return;
    }
    var server_entry = asset.serverFind(server.name);
    if (server_entry === null)
    {
        return;
    }
    $.getJSON(server_entry.server.url + "/assets/" + server_entry.pk + "/status.json", function(data){
              assetServerPopulateStatus(asset, server_entry, data);
              });
}

serverUpdateAssets = function(server)
{
    $.getJSON(server.url + "/assets.json",
    function(data) {
        var assets = [];
        $.each(data['assets'], function(key, val) {
            assets.push(val);
        });
        for (var a in assets)
        {
            assetAddIfNew(assets[a]);
            assetServerAddIfNew(assets[a].name, server, assets[a].pk);
            assetServerUpdateStatus(assets[a].name, server, assets[a].pk);
          }
      }).fail(function() {});
}

serverUpdateStatus = function(server)
{
    $.get(server.url + "/status/", function(data) {
          $("#server_status_" + server.name).html(data);
          $("#server_label_" + server.name).removeClass('server-label-failure');
          $("#server_label_" + server.name).addClass('server-label-connected');
          serverUpdateAssets(server);
          }).fail(function() {
              $("#server_status_" + server.name).html('<tr><td>Unreachable<td></tr>');
              $("#server_label_" + server.name).removeClass('server-label-connected');
              $("#server_label_" + server.name).addClass('server-label-failure');
          });
}

serversUpdateKnown = function()
{
    // Load the known servers
    $.getJSON("servers.json", function (data) {
              var servers = [];
              $.each(data['servers'], function(key, val) {
                     servers.push(val);
              });
              for (var server in servers)
              {
                serverAddIfNew (servers[server]);
                serverUpdateStatus (servers[server]);
              }
    });
}

setupPage = function()
{
    $.ajaxSetup({timeout: 2500 });
    serversUpdateKnown();
    setInterval(function () {
        for (var ks in known_servers)
        {
            serverUpdateStatus(known_servers[ks]);
        }
    }, 3000);
    setInterval(serversUpdateKnown, 30000);
}
