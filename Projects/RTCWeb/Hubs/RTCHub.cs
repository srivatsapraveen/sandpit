using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RTCWeb.Hubs
{
    public class RTCHub : Hub
    {
        public async Task Send(string type,string message)
        {
            await Clients.All.SendAsync("Receive", type, message);
        }

        //public async Task JoinRoom(string room, string user)
        //{
        //    await Groups.AddToGroupAsync(Context.ConnectionId, room);
        //    await Clients.Group(room).SendAsync("Notify", $"{user} has joined the room {room}.");
        //}

    }
}
