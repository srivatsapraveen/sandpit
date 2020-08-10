using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace RTCWeb.Hubs
{
    public class LogHub : Hub
    {
        public async Task Log(string user,string message)
        {
            await Clients.Others.SendAsync("DebugLog", user, message);
        }
    }
}
