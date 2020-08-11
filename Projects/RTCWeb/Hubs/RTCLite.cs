using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace RTCWeb.Hubs
{
    public class RTCLiteHub : Hub
    {
        //public static List<string> Users = new List<string>();
        //public static int UserCount = 0;
        //public override Task OnConnectedAsync()
        //{
        //    UserCount++;
        //    if (UserCount == 1)
        //        Clients.All.SendAsync("created", UserCount);
        //    else
        //        Clients.All.SendAsync("joined", UserCount);
        //    return base.OnConnectedAsync();
        //}

        //public override Task OnDisconnectedAsync(Exception exception)
        //{
        //    UserCount--;
        //    Clients.All.SendAsync("disconnected", UserCount);
        //    return base.OnDisconnectedAsync(exception);
        //}

        //public async Task Clear()
        //{
        //    UserCount = 0;
        //    await Clients.All.SendAsync("cleared", UserCount);
        //}

        public async Task Send(string message)
        {
            await Clients.Others.SendAsync("Receive", message);
        }
    }
}
