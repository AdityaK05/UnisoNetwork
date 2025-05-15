import { Check, Smartphone, Monitor, Tablet, Bell, Shield, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AppPreview() {
  const features = [
    {
      icon: <Bell className="h-5 w-5 text-secondary" />,
      title: "Real-time updates",
      description: "Instant notifications about events and messages from your squad."
    },
    {
      icon: <Shield className="h-5 w-5 text-secondary" />,
      title: "Campus verified",
      description: "Every user is verified with a .edu email for a safe community."
    },
    {
      icon: <UserPlus className="h-5 w-5 text-secondary" />,
      title: "Find your people",
      description: "Our algorithm connects you with students who share your vibe."
    }
  ];

  return (
    <section className="py-20 bg-gray-50 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-100 rounded-full opacity-60 blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-100 rounded-full opacity-50 blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <Badge variant="outline" className="px-3 py-1 text-xs rounded-full mb-6 bg-white border-gray-200">
            Available Everywhere
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 font-poppins">
            UNiSO in your pocket, <span className="text-primary">wherever you go</span>
          </h2>
          
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            Available on all your devices, UNiSO keeps you connected to your campus vibes 24/7
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          {/* App Showcase */}
          <div className="lg:col-span-7 relative mb-16 lg:mb-0">
            <div className="relative mx-auto max-w-[800px]">
              {/* Phone mockup - positioned absolutely for overlap */}
              <div className="absolute -left-6 sm:left-1/4 top-10 w-[220px] sm:w-[260px] z-20 animate-float" style={{animationDelay: '0.5s'}}>
                <div className="relative">
                  <div className="bg-black rounded-[40px] p-2 overflow-hidden shadow-2xl border-[6px] border-black">
                    <div className="bg-white rounded-[32px] overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=1024" 
                        alt="UNiSO mobile app - profile screen" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 p-3 text-white text-xs">
                        <div className="bg-black/30 backdrop-blur-md p-3 rounded-xl">
                          <div className="font-bold">Campus Parties</div>
                          <div className="text-white/80 text-[10px]">3 new events near you this weekend</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white py-2 px-4 rounded-full shadow-lg">
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      <span className="text-xs font-medium">Now online</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main showcase - Laptop or desktop */}
              <div className="relative z-10 mx-auto">
                <div className="bg-gray-900 rounded-t-xl pt-4 pb-2 px-4 shadow-2xl max-w-3xl mx-auto">
                  <div className="flex space-x-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="rounded-t-lg overflow-hidden border-4 border-t-gray-900 border-l-gray-900 border-r-gray-900 border-b-0">
                    <img 
                      className="w-full" 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1600&h=900" 
                      alt="UNiSO web dashboard" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 mix-blend-overlay"></div>
                  </div>
                </div>
                <div className="bg-gray-800 h-4 rounded-b-lg max-w-3xl mx-auto shadow-2xl"></div>
                <div className="bg-gray-700 h-2 rounded-b-lg max-w-[calc(100%-100px)] mx-auto"></div>
              </div>
              
              {/* Tablet mockup - positioned absolutely for overlap */}
              <div className="absolute -right-6 sm:right-10 top-20 w-[200px] sm:w-[240px] z-20 animate-float">
                <div className="bg-black rounded-[20px] p-2 overflow-hidden shadow-2xl rotate-6">
                  <div className="relative bg-white rounded-[12px] overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=512&h=640" 
                      alt="UNiSO tablet app - events screen" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-full">
                        <div className="text-white text-[10px] font-medium">12 new messages</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="lg:col-span-5">
            <div className="flex flex-col space-y-10">
              <div className="grid grid-cols-3 gap-4 text-center mb-8">
                <div className="flex flex-col items-center p-4">
                  <div className="p-3 bg-purple-100 rounded-full mb-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">iOS & Android</span>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="p-3 bg-teal-100 rounded-full mb-3">
                    <Monitor className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Web App</span>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="p-3 bg-pink-100 rounded-full mb-3">
                    <Tablet className="h-6 w-6 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Tablet</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-bold mb-6 font-poppins">Why students love UNiSO</h3>
                
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 bg-secondary/10 p-2 rounded-full">
                        {feature.icon}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
                        <p className="mt-1 text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <img className="h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <img className="h-8 w-8 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                      <div className="h-8 w-8 rounded-full ring-2 ring-white bg-primary flex items-center justify-center text-white text-xs font-medium">
                        +2k
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span className="text-primary">★★★★★</span>
                      <span>4.9/5 from 2,000+ reviews</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <a href="#" className="inline-flex items-center p-1 border border-transparent rounded-xl shadow-md text-white bg-black hover:bg-gray-800 transition-colors">
                  <svg className="h-10 w-28" viewBox="0 0 120 40" fill="currentColor">
                    <path d="M24.37 19.79a5.17 5.17 0 0 1 2.47-4.33 5.3 5.3 0 0 0-4.16-2.24c-1.75-.18-3.44 1.03-4.34 1.03-.9 0-2.29-1.01-3.77-1.01-1.94.01-3.74 1.13-4.73 2.87-2.02 3.5-.52 8.68 1.45 11.52.95 1.37 2.09 2.93 3.57 2.87 1.44-.06 1.98-.93 3.73-.93 1.74 0 2.23.93 3.75.9 1.55-.03 2.53-1.4 3.47-2.77.7-1 1.24-2.1 1.58-3.27a5.1 5.1 0 0 1-2.02-4.64zM22.07 11c.78-.96 1.17-2.17 1.1-3.4a5.56 5.56 0 0 0-2.27 1.87 5.23 5.23 0 0 0-1.13 3.3 4.59 4.59 0 0 0 2.3-1.77z"/>
                    <path d="M42.3 27.14h-4.73l-1.14 3.36h-2l4.48-12.41h2.1l4.47 12.41h-2.04l-1.14-3.36zm-4.24-1.55h3.75l-1.85-5.45h-.05l-1.85 5.45zM55.16 25.97c0 2.82-1.5 4.62-3.78 4.62a3.07 3.07 0 0 1-2.85-1.58h-.04v4.48h-1.86V21.43h1.8v1.5h.04a3.21 3.21 0 0 1 2.88-1.6c2.3 0 3.81 1.8 3.81 4.63zm-1.92 0c0-1.83-.95-3.04-2.4-3.04-1.42 0-2.37 1.23-2.37 3.04 0 1.82.95 3.05 2.38 3.05 1.44 0 2.39-1.2 2.39-3.05zM65.12 25.97c0 2.82-1.5 4.62-3.77 4.62a3.07 3.07 0 0 1-2.85-1.58h-.05v4.48h-1.85V21.43h1.8v1.5h.03a3.21 3.21 0 0 1 2.88-1.6c2.3 0 3.81 1.8 3.81 4.63zm-1.91 0c0-1.83-.95-3.04-2.4-3.04-1.42 0-2.37 1.23-2.37 3.04 0 1.82.95 3.05 2.37 3.05 1.45 0 2.4-1.2 2.4-3.05zM71.71 27c.14 1.23 1.33 2.04 2.97 2.04 1.57 0 2.7-.81 2.7-1.92 0-.96-.68-1.54-2.28-1.94l-1.6-.39c-2.27-.55-3.33-1.61-3.33-3.34 0-2.14 1.87-3.61 4.52-3.61 2.62 0 4.42 1.47 4.48 3.61h-1.88c-.11-1.24-1.14-1.99-2.63-1.99-1.5 0-2.52.75-2.52 1.84 0 .87.65 1.39 2.25 1.79l1.37.34c2.55.6 3.6 1.63 3.6 3.44 0 2.32-1.85 3.78-4.79 3.78-2.75 0-4.61-1.42-4.73-3.67h1.87zM83.35 19.3v2.14h1.72v1.47h-1.72v4.99c0 .78.35 1.14 1.1 1.14.2 0 .41-.02.61-.04v1.46c-.34.06-.69.1-1.04.1-1.85 0-2.58-.7-2.58-2.47v-5.18h-1.3v-1.47h1.3V19.3h1.9zM86.06 25.97c0-2.85 1.68-4.64 4.29-4.64 2.62 0 4.3 1.8 4.3 4.64 0 2.85-1.66 4.64-4.3 4.64-2.63 0-4.29-1.79-4.29-4.64zm6.7 0c0-1.95-.9-3.11-2.4-3.11s-2.41 1.16-2.41 3.11c0 1.96.9 3.12 2.4 3.12 1.51 0 2.4-1.16 2.4-3.12zM96.19 21.43h1.77v1.54h.04a2.15 2.15 0 0 1 2.18-1.64c.22 0 .44.03.65.08v1.74a2.6 2.6 0 0 0-.85-.11c-1.19 0-1.93.8-1.93 2.06v5.4h-1.86V21.43z"/>
                  </svg>
                </a>
                <a href="#" className="inline-flex items-center p-1 border border-transparent rounded-xl shadow-md text-white bg-black hover:bg-gray-800 transition-colors">
                  <svg className="h-10 w-28" viewBox="0 0 135 40" fill="currentColor">
                    <path d="M130 40H5c-2.8 0-5-2.2-5-5V5c0-2.8 2.2-5 5-5h125c2.8 0 5 2.2 5 5v30c0 2.8-2.2 5-5 5z"/>
                    <path d="M130 .8a4.2 4.2 0 0 1 4.2 4.2v30a4.2 4.2 0 0 1-4.2 4.2H5A4.2 4.2 0 0 1 .8 35V5A4.2 4.2 0 0 1 5 .8h125m0-.8H5C2.2 0 0 2.3 0 5v30c0 2.8 2.2 5 5 5h125c2.8 0 5-2.2 5-5V5c0-2.7-2.2-5-5-5z" fill="#a6a6a6"/>
                    <path d="M47.4 10.2c0 .8-.2 1.5-.7 2-.6.6-1.3.9-2.2.9-.9 0-1.6-.3-2.2-.9-.6-.6-.9-1.3-.9-2.2 0-.9.3-1.6.9-2.2.6-.6 1.3-.9 2.2-.9.4 0 .8.1 1.2.3.4.2.7.4.9.7l-.5.5c-.4-.5-.9-.7-1.6-.7-.6 0-1.2.2-1.6.7-.5.4-.7 1-.7 1.7s.2 1.3.7 1.7c.5.4 1 .7 1.6.7.7 0 1.2-.2 1.7-.7.3-.3.5-.7.5-1.2h-2.2v-.8h2.9v.4zM52 7.7h-2.7v1.9h2.5v.7h-2.5v1.9H52v.8h-3.5V7H52v.7zM55.3 13h-.8V7.7h-1.7V7H57v.7h-1.7V13zM59.9 13V7h.8v6h-.8zM64.1 13h-.8V7.7h-1.7V7h4.1v.7H64V13zM73.6 12.2c-.6.6-1.3.9-2.2.9-.9 0-1.6-.3-2.2-.9-.6-.6-.9-1.3-.9-2.2s.3-1.6.9-2.2c.6-.6 1.3-.9 2.2-.9.9 0 1.6.3 2.2.9.6.6.9 1.3.9 2.2 0 .9-.3 1.6-.9 2.2zm-3.8-.5c.4.4 1 .7 1.6.7.6 0 1.2-.2 1.6-.7.4-.4.7-1 .7-1.7s-.2-1.3-.7-1.7c-.4-.4-1-.7-1.6-.7-.6 0-1.2.2-1.6.7-.4.4-.7 1-.7 1.7s.2 1.3.7 1.7zM75.6 13V7h.9l2.9 4.7V7h.8v6h-.8l-3.1-4.9V13h-.7z" fill="#fff" stroke="#fff" strokeWidth=".2"/>
                    <path d="M68.1 21.8c-2.4 0-4.3 1.8-4.3 4.3 0 2.4 1.9 4.3 4.3 4.3s4.3-1.8 4.3-4.3c0-2.6-1.9-4.3-4.3-4.3zm0 6.8c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.4 1 2.4 2.6 0 1.5-1.1 2.6-2.4 2.6zm-9.3-6.8c-2.4 0-4.3 1.8-4.3 4.3 0 2.4 1.9 4.3 4.3 4.3s4.3-1.8 4.3-4.3c0-2.6-1.9-4.3-4.3-4.3zm0 6.8c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.4 1 2.4 2.6 0 1.5-1.1 2.6-2.4 2.6zm-11.1-5.5v1.8H52c-.1 1-.5 1.8-1 2.3-.6.6-1.6 1.3-3.3 1.3-2.7 0-4.7-2.1-4.7-4.8s2.1-4.8 4.7-4.8c1.4 0 2.5.6 3.3 1.3l1.3-1.3c-1.1-1-2.5-1.8-4.5-1.8-3.6 0-6.7 3-6.7 6.6 0 3.6 3.1 6.6 6.7 6.6 2 0 3.4-.6 4.6-1.9 1.2-1.2 1.6-2.9 1.6-4.2 0-.4 0-.8-.1-1.1h-6.2zm45.4 1.4c-.4-1-1.4-2.7-3.6-2.7-2.2 0-4 1.7-4 4.3 0 2.4 1.8 4.3 4.2 4.3 1.9 0 3.1-1.2 3.5-1.9l-1.4-1c-.5.7-1.1 1.2-2.1 1.2s-1.6-.4-2.1-1.3l5.7-2.4-.2-.5zm-5.8 1.4c0-1.6 1.3-2.5 2.2-2.5.7 0 1.4.4 1.6.9l-3.8 1.6zM82.6 30h1.9V17.5h-1.9V30zm-3-7.3c-.5-.5-1.3-1-2.3-1-2.1 0-4.1 1.9-4.1 4.3s1.9 4.2 4.1 4.2c1 0 1.8-.5 2.2-1h.1v.6c0 1.6-.9 2.5-2.3 2.5-1.1 0-1.9-.8-2.1-1.5l-1.6.7c.5 1.1 1.7 2.5 3.8 2.5 2.2 0 4-1.3 4-4.4V22h-1.8v.7zm-2.2 5.9c-1.3 0-2.4-1.1-2.4-2.6s1.1-2.6 2.4-2.6c1.3 0 2.3 1.1 2.3 2.6s-1 2.6-2.3 2.6zm24.4-11.1h-4.5V30h1.9v-4.7h2.6c2.1 0 4.1-1.5 4.1-3.9s-2-3.9-4.1-3.9zm.1 6h-2.7v-4.3h2.7c1.4 0 2.2 1.2 2.2 2.1-.1 1.1-.9 2.2-2.2 2.2zm11.5-1.8c-1.4 0-2.8.6-3.3 1.9l1.7.7c.4-.7 1-.9 1.7-.9 1 0 1.9.6 2 1.6v.1c-.3-.2-1.1-.5-1.9-.5-1.8 0-3.6 1-3.6 2.8 0 1.7 1.5 2.8 3.1 2.8 1.3 0 1.9-.6 2.4-1.2h.1v1h1.8v-4.8c-.2-2.2-1.9-3.5-4-3.5zm-.2 6.9c-.6 0-1.5-.3-1.5-1.1 0-1 1.1-1.3 2-1.3.8 0 1.2.2 1.7.4-.2 1.2-1.2 2-2.2 2zm10.5-6.6-2.1 5.4h-.1l-2.2-5.4h-2l3.3 7.6-1.9 4.2h1.9l5.1-11.8h-2zm-16.8 8h1.9V17.5h-1.9V30z" fill="#fff"/>
                    <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="21.8" y1="31.2" x2="5" y2="14.4" gradientTransform="matrix(1 0 0 -1 0 42)">
                      <stop offset="0" stopColor="#00a0ff"/>
                      <stop offset=".01" stopColor="#00a1ff"/>
                      <stop offset=".26" stopColor="#00beff"/>
                      <stop offset=".51" stopColor="#00d2ff"/>
                      <stop offset=".76" stopColor="#00dfff"/>
                      <stop offset="1" stopColor="#00e3ff"/>
                    </linearGradient>
                    <path d="M10.4 7.5c-.3.3-.4.8-.4 1.4v22.1c0 .6.2 1.1.5 1.4l.1.1L23 20.1v-.2L10.4 7.5z" fill="url(#a)"/>
                    <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="33.8" y1="20" x2="9.6" y2="20" gradientTransform="matrix(1 0 0 -1 0 42)">
                      <stop offset="0" stopColor="#ffe000"/>
                      <stop offset=".41" stopColor="#ffbd00"/>
                      <stop offset=".78" stopColor="#ffa500"/>
                      <stop offset="1" stopColor="#ff9c00"/>
                    </linearGradient>
                    <path d="m27 24.3-4.1-4.1V19.9l4.1-4.1.1.1 4.9 2.8c1.4.8 1.4 2.1 0 2.9l-5 2.7z" fill="url(#b)"/>
                    <linearGradient id="c" gradientUnits="userSpaceOnUse" x1="24.8" y1="17.5" x2="2.1" y2="-5.2" gradientTransform="matrix(1 0 0 -1 0 42)">
                      <stop offset="0" stopColor="#ff3a44"/>
                      <stop offset="1" stopColor="#c31162"/>
                    </linearGradient>
                    <path d="M27.1 24.2 22.9 20 10.4 32.5c.5.5 1.2.5 2.1.1l14.6-8.4" fill="url(#c)"/>
                    <linearGradient id="d" gradientUnits="userSpaceOnUse" x1="7.3" y1="39" x2="17.4" y2="28.9" gradientTransform="matrix(1 0 0 -1 0 42)">
                      <stop offset="0" stopColor="#32a071"/>
                      <stop offset=".07" stopColor="#2da771"/>
                      <stop offset=".48" stopColor="#15cf74"/>
                      <stop offset=".8" stopColor="#06e775"/>
                      <stop offset="1" stopColor="#00f076"/>
                    </linearGradient>
                    <path d="M27.1 15.8 12.5 7.5c-.9-.5-1.6-.4-2.1.1L22.9 20l4.2-4.2z" fill="url(#d)"/>
                    <path d="M27 24.1 12.5 32.3c-.8.5-1.5.4-2 0v.1c0 0 0 0 0 0l.1.1c.5.4 1.2.5 2 0L27 24.1z" opacity=".2"/>
                    <path d="M10.4 32.3c-.3-.3-.4-.8-.4-1.4v.1c0 .6.2 1.1.5 1.4v-.1h-.1zm21.6-11-5 2.8.1.1 4.9-2.8c.7-.4 1-.9 1-1.4 0 .5-.4.9-1 1.3z" opacity=".12"/>
                    <path d="M12.5 7.6 32 18.7c.6.4 1 .8 1 1.3 0-.5-.3-1-1-1.4L12.5 7.5c-1.4-.8-2.5-.2-2.5 1.4v.1c0-1.6 1.1-2.2 2.5-1.4z" opacity=".25" fill="#fff"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
