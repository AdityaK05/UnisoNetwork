import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="pt-28 pb-20 md:pt-32 md:pb-24 overflow-hidden bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1 className="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-poppins">
              <span className="block">UNiSO</span>
              <span className="block text-primary">Connecting Campus.</span>
              <span className="block text-secondary">Empowering Students.</span>
            </h1>
            <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg md:mt-5 md:text-xl">
              Join thousands of students building meaningful connections, sharing resources, and creating opportunities together on your campus network.
            </p>
            <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="py-6 px-8 text-lg font-medium rounded-md transition-colors"
                >
                  Join Your Campus Network
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-3 sm:mt-0 sm:ml-3 py-6 px-8 text-lg font-medium rounded-md transition-colors"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
            {/* Image of students collaborating on campus */}
            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div className="rounded-lg overflow-hidden">
                <img 
                  className="w-full object-cover rounded-lg" 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                  alt="Students collaborating on campus" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/30 mix-blend-multiply rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
