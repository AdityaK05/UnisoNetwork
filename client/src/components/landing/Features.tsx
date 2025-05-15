import { 
  Users, MessageSquare, BookOpen, 
  CalendarDays, Briefcase, GraduationCap 
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Groups",
      description: "Join groups based on your interests, major, or campus activities to connect with like-minded students.",
      action: "Explore groups",
      color: "bg-primary"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Discussion Forums",
      description: "Ask questions, share insights, and participate in academic discussions with peers and professors.",
      action: "Join discussions",
      color: "bg-secondary"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Resource Sharing",
      description: "Access and share study materials, notes, past papers, and helpful resources with your peers.",
      action: "Find resources",
      color: "bg-accent"
    },
    {
      icon: <CalendarDays className="h-6 w-6" />,
      title: "Events Calendar",
      description: "Stay updated with campus events, workshops, seminars, and social gatherings happening around you.",
      action: "View calendar",
      color: "bg-primary"
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: "Job & Internship Board",
      description: "Discover career opportunities, internships, and part-time jobs specifically for students at your university.",
      action: "Browse opportunities",
      color: "bg-secondary"
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Study Groups",
      description: "Form or join study groups for specific courses, projects, or exam preparation with classmates.",
      action: "Find study partners",
      color: "bg-accent"
    }
  ];

  return (
    <section id="features" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-poppins">
            Everything you need on campus
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            UNiSO brings together all the tools and resources you need for a successful college experience.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
                <div className="px-6 py-8 sm:p-10 sm:pb-6">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-md ${feature.color} text-white mb-5`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-4 font-poppins">{feature.title}</h3>
                  <p className="mt-4 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
                <div className="px-6 pt-6 pb-8 bg-gray-50">
                  <a href="#" className="text-base font-medium text-primary hover:text-primary/80">
                    {feature.action} <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
