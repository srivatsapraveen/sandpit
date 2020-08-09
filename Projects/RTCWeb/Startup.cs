using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RTCWeb.Hubs;

namespace RTCWeb
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews().AddRazorRuntimeCompilation();
            //services.AddCors(options => options.AddPolicy("CorsPolicy",
            //            builder =>
            //            {
            //                builder.AllowAnyMethod().AllowAnyHeader()
            //                       .WithOrigins("http://localhost:55830")
            //                       .AllowCredentials();
            //            }));
            services.AddSignalR(hubOptions => {
                hubOptions.EnableDetailedErrors = true;
                hubOptions.MaximumReceiveMessageSize = null;
                hubOptions.KeepAliveInterval = TimeSpan.FromSeconds(3);
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseRouting();
            //app.UseCors("CorsPolicy");
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapHub<ChatHub>("/chathub");
                //endpoints.MapHub<RTCHub>("/rtchub");
                endpoints.MapHub<RTCLiteHub>("/RTCLiteHub", options =>
                {
                    options.ApplicationMaxBufferSize = 1024000;
                    // Set to 0 for no limit, or to some non-zero value (in bytes) to set a different buffer limit
                    options.TransportMaxBufferSize = 0;
                });
            });
        }
    }
}
