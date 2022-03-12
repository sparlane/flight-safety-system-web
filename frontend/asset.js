import $ from 'jquery';

class AssetServer {
    constructor(server, asset, pk)
    {
        this.server = server;
        this.asset = asset;
        this.pk = pk;
    }
    getURL(path)
    {
        return this.server.getURL(`/assets/${this.pk}/${path}`);
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
        for (var s in this.servers)
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
    getServerCount() {
        return this.servers.length;
    }
    sendCommand(data)
    {
        for (var s in this.servers)
        {
            var url = this.servers[s].getURL('command/set/');
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
    Manual()
    {
        let data = { command: 'MAN' };
        this.sendCommand(data);
    }
    positionMostRecent()
    {
        var position = null;
        for (var s in this.servers)
        {
            var server_entry = this.servers[s];
            if (server_entry.position && (position === null || server_entry.position.timestamp > position.timestamp))
            {
                position = server_entry.position;
            }
        }
        return position;
    }
}

export function createAsset(asset_name)
{
    return new Asset(asset_name);
}