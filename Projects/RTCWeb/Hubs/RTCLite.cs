using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace RTCWeb.Hubs
{
    public class RTCLiteHub : Hub
    {
        public async Task Send(string message)
        {
            await Clients.Others.SendAsync("Receive", message);
        }
    }
}
