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

const rtt_time_warn = 10 * 1000;
const rtt_time_old = 60 * 1000;

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

function dm_to_deg(dm_str)
{
    var parts = dm_str.split(' ');
    var d = parseInt(parts[0]);
    var mins = parseFloat(parts[1]);
    var dir = parts[2];
    var dec = mins / 60;
    var degs = d + dec;
    if (dir === 'S' || dir === 'W')
    {
        degs = degs * -1;
    }
    return degs;
}

dialogCreate = function(title, text, buttons)
{
    $("#dialog-header").html(title);
    $("#dialog-body").html(text);
    button_html = '';
    for (var b in buttons)
    {
        var btn = buttons[b];
        button_html += '<button class="btn ' + btn.btn_class + '" onclick="' + btn.onclick + '">' + btn.label + '</button>';
    }
    button_html += '<button type="button" class="btn btn-primary" data-dismiss="modal">Cancel</button>';
    $("#dialog-buttons").html(button_html);
    $("#dialog-modal").modal('show');
}

dialogHide = function()
{
    $("#dialog-modal").modal('hide');
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

assetServerGetURL = function(server_entry)
{
    return server_entry.server.url + "/assets/" + server_entry.pk + "/";
}

assetSendCommand = function(asset, data)
{
    dialogHide();
    for (var s in asset.servers)
    {
        var url = assetServerGetURL(asset.servers[s]) + "command/set/";
        $.post(url, data);
    }
}

assetRTL = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'RTL' };
        assetSendCommand(asset, data);
    }
}

assetHold = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'HOLD' };
        assetSendCommand(asset, data);
    }
}

assetContinue = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'RON' };
        assetSendCommand(asset, data);
    }
}

assetGoto = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = {
            command: 'GOTO',
            latitude: dm_to_deg($("#asset-goto-latitude").val()),
            longitude: dm_to_deg($("#asset-goto-longitude").val())
        };
        assetSendCommand(asset, data);
    }
}

assetGotoDialog = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        // Find the most recent position report
        var position = null;
        for (var s in asset.servers)
        {
            var server_entry = asset.servers[s];
            if (position === null || server_entry.position.timestamp > position.timestamp)
            {
                position = server_entry.position;
            }
        }
        html = '<div>';
        html += '<input type="text" id="asset-goto-latitude" value="' + deg_to_dm(position.lat, true) + '"></input>';
        html += '<input type="text" id="asset-goto-longitude" value="' + deg_to_dm(position.lng, false) + '"></input>';
        html += '<div id="map" class="dialog-map"></div>';
        html += '</div>';
        dialogCreate('Send ' + asset_name + ' to', html, [{ btn_class: 'btn-light', label: 'Goto', onclick: 'assetGoto(\'' + asset_name + '\')'}]);
        var map = L.map('map').setView([position.lat, position.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        var m = L.marker([position.lat, position.lng], {draggable: true, autopan: true })
        m.addTo(map);
        m.on('dragend', function() {
             var markerCoords = m.getLatLng();
             $("#asset-goto-latitude").val(deg_to_dm(markerCoords.lat, true));
             $("#asset-goto-longitude").val(deg_to_dm(markerCoords.lng, false));
             });
    }
}

assetAltitude = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'ALT', altitude: $("#asset-altitude").val() };
        assetSendCommand(asset, data);
    }
}

assetAltitudeDialog = function(asset_name)
{
    dialogCreate('Adjust ' + asset_name + ' Altitude', 'New altitude: <input type="text" size="3" maxlength="3" min="0" max="999" value="100" id="asset-altitude"></input>ft', [{ btn_class: 'btn-light', label: 'Set Altitude', onclick: 'assetAltitude(\'' + asset_name + '\')'}]);
}


assetDisArm = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'DISARM' };
        assetSendCommand(asset, data);
    }
}

assetDisArmDialog = function(asset_name)
{
    dialogCreate('Disarm ' + asset_name, 'Warning this will probably result in the aircraft crashing use only when all other options are unsafe', [{ btn_class: 'btn-danger', label: 'DisArm', onclick: 'assetDisArm(\'' + asset_name + '\')'}]);
}

assetTerminate = function(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        data = { command: 'TERM' };
        assetSendCommand(asset, data);
    }
}

assetTerminateDialog = function(asset_name)
{
    dialogCreate('Terminate ' + asset_name, 'Warning this will cause the aircraft to immediately terminate flight and most certainly destroy it, be sure the area directly under the aircraft is free of any people and property. Use RTL or Hold instead.', [{ btn_class: 'btn-danger', label: 'Terminate Flight', onclick: 'assetTerminate(\'' + asset_name + '\')'}, { btn_class: 'btn-light', label: 'RTL', onclick: 'assetRTL(\'' + asset_name + '\')' }, { btn_class: 'btn-light', label: 'Hold', onclick: 'assetHold(\'' + asset_name + '\')' }]);
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
        
        html = '<div class="asset" id="asset_' + asset.name + '">';
        html += '<div class="asset-label" id="asset_label_' + asset.name + '">' + asset.name + '</div>';
        html += '<div class="asset-buttons btn-group" role="group" id="asset_buttons_' + asset.name + '">';
        html += '<button class="btn btn-light" onclick="assetRTL(\'' + asset.name + '\')">RTL</button>';
        html += '<button class="btn btn-light" onclick="assetHold(\'' + asset.name + '\')">Hold</button>';
        html += '<button class="btn btn-light" onclick="assetAltitudeDialog(\'' + asset.name + '\')">Altitude</button>';
        html += '<button class="btn btn-light" onclick="assetGotoDialog(\'' + asset.name + '\')">Goto</button>';
        html += '<button class="btn btn-light" onclick="assetContinue(\'' + asset.name + '\')">Continue</button>';
        html += '<button class="btn btn-danger" onclick="assetDisArmDialog(\'' + asset.name + '\')">DisArm</button>';
        html += '<button class="btn btn-danger" onclick="assetTerminateDialog(\'' + asset.name + '\')">Terminate</button>';
        html += '</div>';
        html += '<div class="asset-status" id="asset_status_' + asset.name + '"></div>';
        html += '</div>';

        $("div#assets").append(html);
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
            html += '<div class="asset-status-command" id="' + id_prefix + '_command"></div>';
            html += '<table class="asset-rtt-status" id="' + id_prefix + '_rtt">';
            html += "<tr><td>RTT (ms)</td><td>min</td><td>max</td><td>avg</td></tr>";
            html += '<tr><td class="asset-rtt" id="' + id_prefix + '_rtt_value"></td><td class="asset-rtt" id="' + id_prefix + '_rtt_min"></td><td class="asset-rtt" id="' + id_prefix + '_rtt_max"></td><td class="asset-rtt" id="' + id_prefix + '_rtt_avg"></td></tr>';
            html += '</table>';
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
        server_entry.position = data['position'];
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
    if ('rtt' in data)
    {
        $("#" + server_entry.id_prefix + "_rtt_value").html(data['rtt']['rtt']);
        $("#" + server_entry.id_prefix + "_rtt_min").html(data['rtt']['rtt_min']);
        $("#" + server_entry.id_prefix + "_rtt_max").html(data['rtt']['rtt_max']);
        $("#" + server_entry.id_prefix + "_rtt_avg").html(data['rtt']['rtt_avg']);
        fieldMarkOld("#" + server_entry.id_prefix + "_rtt", data.rtt.timestamp, rtt_time_old, rtt_time_warn, "asset-rtt-time");
    }
    if ('command' in data)
    {
        var command_txt = data['command']['command'];
        if (data['command']['command'] == "Goto Position")
        {
            command_txt += " " + deg_to_dm(data['command']['lat'], true) + ", " + deg_to_dm(data['command']['lng']);
        }
        if (data['command']['command'] == "Adjust Altitude")
        {
            command_txt += " to " + data['command']['alt'] + "ft";
        }
        $("#" + server_entry.id_prefix + "_command").html(command_txt);
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
