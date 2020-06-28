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

function dialogCreate(title, text, buttons, classes)
{
    $("#dialog-header").html(title);
    $("#dialog-body").html(text);
    if(classes){
        $("#dialog-modal").addClass(classes);
    }
    button_html = '';
    for (var b in buttons)
    {
        var btn = buttons[b];
        button_html += `<button class="btn ${btn.btn_class}" onclick="${btn.onclick}">${btn.label}</button>`;
    }
    button_html += '<button type="button" class="btn btn-primary" data-dismiss="modal">Cancel</button>';
    $("#dialog-buttons").html(button_html);
    $("#dialog-modal").modal('show');
}

function dialogHide()
{
    $('#dialog-modal').on('shown.bs.modal', () => {});
    $("#dialog-modal").modal('hide');
    $("#dialog-modal").removeClass().addClass('modal fade');
}

class Server {
    constructor(server_name) {
        this.name = server_name;
    }

}

function serverFind(name)
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

function serverAddIfNew(server)
{
    var existing = serverFind(server.name);
    if (existing === null)
    {
        known_servers.push(server);
        /* Present new server */
        $("div#servers").append('<div class="server" id="server_' + server.name + '"><div id="server_label_' + server.name + '" class="server-label">' + server.name + '</div><table id="server_status_' + server.name + '" class="server-status"><tr><td>Connecting</td></tr></table><div id="server_login_info_' + server.name + '" class="server-login">Unknown</div></div>');
    }
}

class AssetServer {
    constructor(server, asset, pk)
    {
        this.server = server;
        this.asset = asset;
        this.pk = pk;
    }
    getURL()
    {
        return this.server.url + "/assets/" + this.pk + "/";
    }
}

class Asset {
    constructor(asset_name)
    {
        this.name = asset_name;
        this.servers = [];
    }
    serverFind(name)
    {
        for (var s in asset.servers)
        {
            if (this.servers[s].server.name === name)
            {
                return this.servers[s];
            }
        }
        return null;
    }
    serverAdd(server, pk)
    {
        let server_entry = this.serverFind(server.name);
        if (server_entry === null)
        {
            let new_asset_server = new AssetServer(server, this, pk);
            this.servers.push(new_asset_server);
            return new_asset_server;
        }
        return server_entry;
    }
    sendCommand(data)
    {
        dialogHide();
        for (var s in this.servers)
        {
            var url = this.servers[s].getURL() + "command/set/";
            $.post(url, data);
        }
    }
    RTL()
    {
        let data = { command: 'RTL' };
        this.sendCommand(data);
    }
    Hold()
    {
        let data = { command: 'HOLD' };
        this.sendCommand(data);
    }
    Continue()
    {
        let data = { command: 'RON' };
        this.sendCommand(data);
    }
    Goto(lat, lng)
    {
        let data = {
            command: 'GOTO',
            latitude: lat,
            longitude: lng,
        };
        this.sendCommand(data);
    }
    Altitude(alt)
    {
        let data = { command: 'ALT', altitude: alt };
        this.sendCommand(data);
    }
    DisArm()
    {
        let data = { command: 'DISARM' };
        this.sendCommand(data);
    }
    Terminate()
    {
        let data = { command: 'TERM' };
        this.sendCommand(data);
    }
    positionMostRecent()
    {
        var position = null;
        for (var s in this.servers)
        {
            var server_entry = this.servers[s];
            if (position === null || server_entry.position.timestamp > position.timestamp)
            {
                position = server_entry.position;
            }
        }
        return position;
    }
}

function assetFind(name)
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

function assetGotoDialog(asset_name)
{
    asset = assetFind(asset_name);
    if (asset !== null)
    {
        // Find the most recent position report
        let position = asset.positionMostRecent();
        let html =`<div>
                    <input type="text" id="asset-goto-latitude" value="${deg_to_dm(position.lat, true)}"></input>
                    <input type="text" id="asset-goto-longitude" value="${deg_to_dm(position.lng, false)}"></input>
                    <div id="map" class="dialog-map"/>
                    </div>`;
        dialogCreate(`Send ${asset_name} to`,
            html,
            [{
                btn_class: 'btn-light',
                label: 'Goto',
                onclick: `assetFind('${asset_name}').Goto(dm_to_deg($('#asset-goto-latitude').val()), dm_to_deg($('#asset-goto-longitude').val()))`
            }], 'map-modal');
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
        $('#dialog-modal.map-modal').on('shown.bs.modal', () => {map.invalidateSize();});
    }
}

function assetAltitudeDialog(asset_name)
{
    dialogCreate('Adjust ' + asset_name + ' Altitude',
        'New altitude: <input type="text" size="3" maxlength="3" min="0" max="999" value="100" id="asset-altitude"></input>ft',
        [{ btn_class: 'btn-light', label: 'Set Altitude', onclick: `assetFind('${asset_name}').Altitude($("#asset-altitude").val()`}]);
}

function assetDisArmDialog(asset_name)
{
    dialogCreate('Disarm ' + asset_name,
        'Warning this will probably result in the aircraft crashing use only when all other options are unsafe',
        [{ btn_class: 'btn-danger', label: 'DisArm', onclick: `assetFind('${asset_name}').DisArm()`}]);
}

function assetTerminateDialog(asset_name)
{
    dialogCreate('Terminate ' + asset_name,
        'Warning this will cause the aircraft to immediately terminate flight and most certainly destroy it, be sure the area directly under the aircraft is free of any people and property. Use RTL or Hold instead.',
        [{
            btn_class: 'btn-danger',
            label: 'Terminate Flight',
            onclick: `assetFind('${asset_name}').Terminate()`
        },{
            btn_class: 'btn-light',
            label: 'RTL',
            onclick: `assetFind('${asset_name}').RTL()`
        }, {
            btn_class: 'btn-light',
            label: 'Hold',
            onclick: `assetFind('${asset_name}').Hold()`
        }]);
}

function assetAddIfNew(asset_data)
{
    var existing = assetFind(asset_data.name);
    if (existing === null)
    {
        asset = new Asset(asset_data.name);
        known_assets.push(asset);
        
        let html = `
            <div class="asset" id="asset_${asset.name}">
                <div class="asset-label" id="asset_label_${asset.name}">${asset.name}</div>
                <div class="asset-buttons btn-group" role="group" id="asset_buttons_${asset.name}">
                    <button class="btn btn-light" onclick="assetFind('${asset.name}').RTL()">RTL</button>
                    <button class="btn btn-light" onclick="assetFind('${asset.name}').Hold()">Hold</button>
                    <button class="btn btn-light" onclick="assetAltitudeDialog('${asset.name}')">Altitude</button>
                    <button class="btn btn-light" onclick="assetGotoDialog('${asset.name}')">Goto</button>
                    <button class="btn btn-light" onclick="assetFind('${asset.name}').Continue()">Continue</button>
                    <button class="btn btn-danger" onclick="assetDisArmDialog('${asset.name}')">DisArm</button>
                    <button class="btn btn-danger" onclick="assetTerminateDialog('${asset.name}')">Terminate</button>
                </div>
                <div class="asset-status" id="asset_status_${asset.name}"></div>
            </div>`;

        $("div#assets").append(html);
        return asset;
    }
    return existing;
}

function UIAssetStatus(asset)
{
    return $('#asset_status_' + asset.name);
}

function UIAssetServerIdPrefix(server_entry)
{
    return 'asset_status_' + server_entry.asset.name + '_server_' + server_entry.server.name;
}

function UIAssetServerAdd(server_entry)
{
    let id_prefix = UIAssetServerIdPrefix(server_entry);
    let html = `
    <div class="asset-status-server" id="${id_prefix}">
        <div class="asset-status-server-label">${server_entry.server.name}</div>
        <div class="asset-status-command" id="${id_prefix}_command"></div>
        <table class="asset-rtt-status" id="${id_prefix}_rtt">
            <tr><td>RTT (ms)</td><td>min</td><td>max</td><td>avg</td></tr>
            <tr>
                <td class="asset-rtt" id="${id_prefix}_rtt_value"></td>
                <td class="asset-rtt" id="${id_prefix}_rtt_min"></td>
                <td class="asset-rtt" id="${id_prefix}_rtt_max"></td>
                <td class="asset-rtt" id="${id_prefix}_rtt_avg"></td>
            </tr>
        </table>
        <div class="asset-position" id="${id_prefix}_position">Waiting for position ...</div>
        <table class="asset-battery-status" id="${id_prefix}_battery">
            <tr><td>Remaining %</td><td>Used (mAh)</td></tr>
            <tr>
                <td id="${id_prefix}_battery_remaining">Unknown</td>
                <td id="${id_prefix}_battery_used">Unknown</td>
            </tr>
        </table>
            <table class="asset-search-status" id="${id_prefix}_search">
                <tr><td>Search</td><td>Completed</td><td>Total</td></tr>
                <tr>
                    <td id="${id_prefix}_search_id">Unknown</td>
                    <td id="${id_prefix}_search_current">Unknown</td>
                    <td id="${id_prefix}_search_total">Unknown</td>
                </tr>
            </table>
    </div>`;
    UIAssetStatus(server_entry.asset).append(html);
}

function fieldMarkOld(field, timestamp, old, warn, prefix)
{
    var dbTime = new Date(timestamp);
    var timeDelta = (new Date()).getTime() - dbTime.getTime();
    if (timeDelta > old)
    {
        $(field).addClass(prefix + "-old");
    }
    else if (timeDelta > warn)
    {
        $(field).addClass(prefix + "-warn");
    }
    else
    {
        $(field).removeClass(prefix + "-old");
        $(field).removeClass(prefix + "-warn");
    }
}

function UIAssetServerPopulateStatus(server_entry, data)
{
    let id_prefix = UIAssetServerIdPrefix(server_entry);
    if ('position' in data)
    {
        $("#" + id_prefix + "_position").html(deg_to_dm(data.position.lat, true) + ' ' + deg_to_dm(data.position.lng, false));
        fieldMarkOld("#" + id_prefix + "_position", data.position.timestamp, asset_position_time_old, asset_position_time_warn, "asset-position");
        server_entry.position = data['position'];
    }
    if ('status' in data)
    {
        $("#" + id_prefix + "_battery_remaining").html(data['status']['battery_percent']);
        $("#" + id_prefix + "_battery_used").html(data['status']['battery_used']);
        if (data['status']['battery_percent'] < battery_critical)
        {
            $("#" + id_prefix + "_battery").addClass("asset-battery-critical");
        }
        else if(data['status']['battery_percent'] < battery_warn)
        {
            $("#" + id_prefix + "_battery").addClass("asset-battery-warn");
        }
        fieldMarkOld("#" + id_prefix + "_battery", data.status.timestamp, battery_time_old, battery_time_warn, "asset-battery-time");
    }
    if ('search' in data)
    {
        $("#" + id_prefix + "_search_id").html(data['search']['id']);
        $("#" + id_prefix + "_search_current").html(data['search']['progress']);
        $("#" + id_prefix + "_search_total").html(data['search']['total']);
        fieldMarkOld("#" + id_prefix + "_search", data.search.timestamp, search_time_old, search_time_warn, "asset-search-time");
    }
    if ('rtt' in data)
    {
        $("#" + id_prefix + "_rtt_value").html(data['rtt']['rtt']);
        $("#" + id_prefix + "_rtt_min").html(data['rtt']['rtt_min']);
        $("#" + id_prefix + "_rtt_max").html(data['rtt']['rtt_max']);
        $("#" + id_prefix + "_rtt_avg").html(data['rtt']['rtt_avg']);
        fieldMarkOld("#" + id_prefix + "_rtt", data.rtt.timestamp, rtt_time_old, rtt_time_warn, "asset-rtt-time");
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
        $("#" + id_prefix + "_command").html(command_txt);
    }
}

function UIAssetServerUpdateStatus(server_entry)
{
    $.getJSON(server_entry.server.url + "/assets/" + server_entry.pk + "/status.json", function(data){
              UIAssetServerPopulateStatus(server_entry, data);
              });
}

function serverUpdateAssets(server)
{
    $.getJSON(server.url + "/assets.json",
    function(data) {
        var assets = [];
        $.each(data['assets'], function(key, val) {
            assets.push(val);
        });
        for (var a in assets)
        {
            asset = assetAddIfNew(assets[a]);
            let server_entry = asset.serverFind(server.name);
            if (server_entry === null)
            {
                server_entry = asset.serverAdd(server, assets[a].pk);
                UIAssetServerAdd(server_entry);
            }
            UIAssetServerUpdateStatus(server_entry);
          }
      }).fail(function() {});
}

function serverUpdateStatus(server)
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
    $.get(server.url + "/current_user/", function(data) {
        if (data['currentUser'] == null)
        {
            $("#server_login_info_" + server.name).html("<a href=\"" + server.url + "/login/\">Login Here</a>");
        }
        else
        {
            $("#server_login_info_" + server.name).html("Logged in as: " + data.currentUser);
        }
    });
}

function serversUpdateKnown()
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

function setupPage()
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
