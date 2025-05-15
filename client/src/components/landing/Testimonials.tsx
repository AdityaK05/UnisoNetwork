import { Badge } from "@/components/ui/badge";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "UNiSO is the only app I check between classes 😎 Found my squad for the semester and even scored a summer internship!",
      name: "Jamie",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      major: "Biology",
      year: "Junior",
      school: "Stanford",
      reactions: [
        { emoji: "🙌", count: 45 },
        { emoji: "💯", count: 32 }
      ],
      gradientClass: "bg-gradient-card-1"
    },
    {
      quote: "Made friends in my first week on campus thanks to UNiSO's events page! The app's UI is fire and the community is unmatched fr fr",
      name: "Alex",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      major: "Computer Science",
      year: "Sophomore",
      school: "MIT",
      reactions: [
        { emoji: "🔥", count: 67 },
        { emoji: "🚀", count: 24 }
      ],
      gradientClass: "bg-gradient-card-2"
    },
    {
      quote: "No cap, UNiSO's study groups saved my grades this semester. Plus the memes in the forums are actually funny unlike the school meme page lol",
      name: "Sophia",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      major: "Economics",
      year: "Senior",
      school: "NYU",
      reactions: [
        { emoji: "😂", count: 38 },
        { emoji: "👏", count: 29 }
      ],
      gradientClass: "bg-gradient-card-3"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-lime/10 rounded-full -z-10 transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary/10 rounded-full -z-10 transform translate-x-1/4 translate-y-1/4"></div>
        
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm rounded-full bg-accent/20 text-accent border-0">
            The Vibes
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 font-poppins">
            What the <span className="text-accent">real ones</span> are saying
          </h2>
          
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Don't just take our word for it - here's what students across campuses think about UNiSO.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover-lift transition-all"
            >
              {/* Card header with gradient */}
              <div className={`${testimonial.gradientClass} h-24 p-6 flex items-end`}>
                <div className="h-16 w-16 rounded-full border-4 border-white overflow-hidden translate-y-8">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 pt-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">
                      {testimonial.major} @ {testimonial.school} • {testimonial.year}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {testimonial.reactions.map((reaction, i) => (
                      <div key={i} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <span className="emoji-pop mr-1">{reaction.emoji}</span>
                        <span className="text-xs text-gray-600">{reaction.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <p className="text-gray-700">
                    {testimonial.quote}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Posted 2 weeks ago</span>
                  <div className="flex space-x-2">
                    <button className="text-sm flex items-center text-gray-500 hover:text-primary transition-colors">
                      <span className="emoji-pop">❤️</span> 
                      <span className="ml-1">Like</span>
                    </button>
                    <button className="text-sm flex items-center text-gray-500 hover:text-primary transition-colors">
                      <span className="emoji-pop">💬</span>
                      <span className="ml-1">Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Show more testimonials section */}
        <div className="mt-14 text-center">
          <p className="text-primary mb-6 inline-flex items-center">
            <span className="emoji-pop">👋</span>
            <span className="mx-2">Join thousands of students already on UNiSO</span>
            <span className="emoji-pop">👋</span>
          </p>
          <a 
            href="#" 
            className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-gray-800 font-medium"
          >
            See more student stories
          </a>
        </div>
      </div>
    </section>
  );
}
