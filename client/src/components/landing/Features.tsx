import { 
  Users, MessageSquare, BookOpen, 
  CalendarDays, Briefcase, RotateCcw 
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Users className="h-7 w-7" />,
      emoji: "👥",
      title: "Community Groups",
      description: "Find your people! Join groups that match your vibe, from anime fans to future entrepreneurs.",
      gradientClass: "bg-gradient-card-1",
      action: "Find your tribe →"
    },
    {
      icon: <CalendarDays className="h-7 w-7" />,
      emoji: "🎉",
      title: "Campus Events",
      description: "Never miss the fun! Parties, club meetups, workshops, and every cool happening on campus.",
      gradientClass: "bg-gradient-card-2",
      action: "See what's poppin' →"
    },
    {
      icon: <MessageSquare className="h-7 w-7" />,
      emoji: "💬",
      title: "Real Talk Forums",
      description: "Ask anything, talk about everything. No filter conversations about classes, profs, and campus life.",
      gradientClass: "bg-gradient-card-3",
      action: "Get the tea →"
    },
    {
      icon: <Briefcase className="h-7 w-7" />,
      emoji: "💼",
      title: "Internship & Job Board",
      description: "Snag that dream internship or side hustle. Exclusive opportunities just for students like you.",
      gradientClass: "bg-gradient-card-4",
      action: "Level up your resume →"
    },
    {
      icon: <BookOpen className="h-7 w-7" />,
      emoji: "📚",
      title: "Resource Swaps",
      description: "Clutch notes, study guides, and materials shared by fellow students who actually aced the class.",
      gradientClass: "bg-gradient-card-5",
      action: "Study smarter →"
    }
  ];

  return (
    <section id="features" className="py-24 bg-white relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-hero transform -skew-y-3"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-100 rounded-full opacity-30 -z-10"></div>
      <div className="absolute top-1/4 left-0 w-56 h-56 bg-teal-100 rounded-full opacity-20 -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full mb-4">
            <RotateCcw className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">The whole campus in one app</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 font-poppins">
            Everything you need to 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> thrive at college</span>
          </h2>
          
          <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
            UNiSO has all the tools that make campus life easier, more connected, and way more fun.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="relative rounded-2xl overflow-hidden group hover-lift transition-all duration-300"
            >
              {/* Card background with gradient */}
              <div className={`absolute inset-0 ${feature.gradientClass} opacity-90`}></div>
              
              {/* Content */}
              <div className="relative p-8 text-white h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    {feature.icon}
                  </div>
                  <span className="text-3xl emoji-pop">{feature.emoji}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 font-poppins">{feature.title}</h3>
                
                <p className="text-white/80 mb-6 flex-grow">
                  {feature.description}
                </p>
                
                <a 
                  href="#" 
                  className="inline-flex items-center text-white font-medium bg-white/20 hover:bg-white/30 transition-colors rounded-full py-2 px-4 mt-auto"
                >
                  {feature.action}
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional promo section */}
        <div className="mt-16 bg-gray-50 rounded-3xl p-8 md:p-12 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-card-3 rounded-full opacity-20"></div>
          <div className="absolute top-0 left-1/3 w-20 h-20 bg-gradient-card-2 rounded-full opacity-20"></div>
          
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-poppins mb-4">
                Never miss what matters to you
              </h3>
              <p className="text-gray-600">
                UNiSO's smart notifications keep you in the loop about events you'll love, discussions that match your interests, and opportunities that fit your goals.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-primary">
                  #Study Groups
                </span>
                <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-secondary">
                  #Campus Events
                </span>
                <span className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-accent">
                  #Internships
                </span>
                <span className="inline-flex items-center rounded-full bg-lime-100 px-3 py-1 text-sm font-medium text-lime">
                  #Dorm Life
                </span>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center">
              <div className="relative">
                <img 
                  className="h-auto w-full max-w-sm rounded-2xl shadow-lg" 
                  src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=774&q=80" 
                  alt="Students using UNiSO app"
                />
                <div className="absolute -top-6 -right-6 bg-white rounded-xl py-2 px-3 shadow-lg">
                  <div className="flex items-center">
                    <span className="text-primary text-lg mr-2">📅</span>
                    <span className="text-sm font-medium">Event in 30 mins!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
