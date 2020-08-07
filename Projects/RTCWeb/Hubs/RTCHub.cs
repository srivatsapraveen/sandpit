using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace RTCWeb.Hubs
{
    public class RTCHub : Hub
    {
        public async Task Send(string message)
        {
            await Clients.Others.SendAsync("Receive", message);
        }

    }
}
