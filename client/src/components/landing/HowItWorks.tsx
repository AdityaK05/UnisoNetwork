export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Sign Up",
      description: "Create your profile with your school email"
    },
    {
      number: 2,
      title: "Connect",
      description: "Join groups based on your interests and classes"
    },
    {
      number: 3,
      title: "Engage",
      description: "Participate in discussions and events"
    },
    {
      number: 4,
      title: "Thrive",
      description: "Grow your network and make the most of campus life"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-poppins">
            Simple steps to get started
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Join your campus community in just a few easy steps.
          </p>
        </div>

        <div className="mt-16">
          <div className="relative">
            {/* Steps for medium-large screens */}
            <div className="hidden md:block">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div key={index} className="text-center">
                    <span className="relative flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary text-white">
                      <span className="text-lg font-bold">{step.number}</span>
                    </span>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-xs">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps for small screens */}
            <div className="md:hidden space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                    <span className="text-lg font-bold">{step.number}</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
