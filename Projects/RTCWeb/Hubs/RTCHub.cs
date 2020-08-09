using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;

namespace RTCWeb.Hubs
{
    public class RTCHub : Hub
    {
        //public static List<string> Users = new List<string>();
        public static int UserCount = 0;
        public override Task OnConnectedAsync()
        {
            UserCount++;
            if (UserCount == 1)
                Clients.All.SendAsync("created", UserCount);
            else
                Clients.All.SendAsync("joined", UserCount);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            UserCount--;
            Clients.All.SendAsync("disconnected", UserCount);
            return base.OnDisconnectedAsync(exception);
        }

        public async Task Clear()
        {
            UserCount = 0;
            await Clients.All.SendAsync("cleared", UserCount);
        }

        public async Task Send(string type,string message)
        {
            try
            {
                await Clients.Others.SendAsync("Receive", type, message);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync("Log", ex.Message);
            }
        }

        public async Task Do(string action, string message)
        {
            switch(action)
            {
                case "join":
                    break;
                default:
                    break;
            }
            await Clients.All.SendAsync("Receive", action, message);
        }

        //public async Task JoinRoom(string room, string user)
        //{
        //    await Groups.AddToGroupAsync(Context.ConnectionId, room);
        //    await Clients.Group(room).SendAsync("Notify", $"{user} has joined the room {room}.");
        //}
    }
}
