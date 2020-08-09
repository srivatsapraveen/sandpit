using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RTCWeb.Hubs
{
    public class ChatHub : Hub
    {
        public async Task AddToGroup(string room, string user)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, room);
            await Clients.Group(room).SendAsync("Notify", $"{user} has joined {room}.");
        }

        //public async Task AddToGroup(string room, string user)
        //{
        //    await Groups.AddToGroupAsync(user, room);
        //    await Clients.Group(room).SendAsync("Send", $"{user} has joined the room {room}.");
        //}

        public Task SendPrivateMessage(string user, string message)
        {
            return Clients.User(user).SendAsync("ReceiveMessage", message);
        }

        public Task SendMessageToGroup(string message, string room, string user)
        {
            return Clients.Group(room).SendAsync("ReceiveMessage", user, message);
        }
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
        public Task SendMessageToCaller(string message)
        {
            return Clients.Caller.SendAsync("ReceiveMessage", message);
        }


    }
}
