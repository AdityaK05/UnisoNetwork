export default function Testimonials() {
  const testimonials = [
    {
      quote: "UNiSO helped me find my study group for organic chemistry. We've been meeting weekly for a semester now, and my grades have improved significantly!",
      name: "Jamie Miller",
      role: "Biology Major, Stanford University",
      initials: "JM",
      bgColor: "bg-primary-100",
      textColor: "text-primary-700"
    },
    {
      quote: "The internship board on UNiSO connected me with a local tech startup. I'm now working part-time while finishing my degree in Computer Science!",
      name: "Alex Johnson",
      role: "Computer Science, MIT",
      initials: "AJ",
      bgColor: "bg-secondary-100",
      textColor: "text-secondary-700"
    },
    {
      quote: "As an international student, UNiSO made it easy to connect with other students and find events happening on campus. It helped me feel at home!",
      name: "Sophia Patel",
      role: "Economics, NYU",
      initials: "SP",
      bgColor: "bg-accent-100",
      textColor: "text-accent-700"
    }
  ];

  return (
    <section id="testimonials" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Testimonials</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-poppins">
            What students are saying
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Hear from students who have transformed their campus experience with UNiSO.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 relative">
              <div className="absolute -top-4 left-6 text-primary text-5xl">"</div>
              <div className="pt-6">
                <p className="text-gray-600 italic">
                  {testimonial.quote}
                </p>
                <div className="mt-6 flex items-center">
                  <div className={`h-10 w-10 rounded-full ${testimonial.bgColor} flex items-center justify-center`}>
                    <span className={`${testimonial.textColor} font-semibold`}>{testimonial.initials}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
