using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using RTCWeb.Models;

namespace RTCWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            ViewBag.RoomID = "";
            ViewBag.UserID = "";
            return View();
        }

        public IActionResult Test(string roomid, string userid)
        {
            ViewBag.RoomID = roomid;
            ViewBag.UserID = userid;
            return View();
        }

        public IActionResult Chat(string roomid, string userid)
        {
            ViewBag.RoomID = roomid;
            ViewBag.UserID = userid;
            return View();
        }

        public IActionResult Room(string roomid, string userid)
        {
            ViewBag.RoomID = roomid;
            ViewBag.UserID = userid;
            return View();
        }

        public IActionResult DebugLog()
        {
            ViewBag.RoomID = "DEBUG MONITOR";
            ViewBag.UserID = "WEBRTC ADMIN";
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
