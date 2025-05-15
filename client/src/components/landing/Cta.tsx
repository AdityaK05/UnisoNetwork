import { Button } from "@/components/ui/button";

export default function Cta() {
  return (
    <section className="py-16 bg-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to transform your campus experience?</span>
            <span className="block text-primary-200">Join UNiSO today.</span>
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row lg:mt-0 lg:flex-shrink-0">
            <Button
              size="lg"
              variant="secondary"
              className="rounded-md shadow bg-white text-primary-600 hover:bg-gray-100"
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="mt-3 sm:mt-0 sm:ml-3 rounded-md shadow text-white border-white hover:bg-primary-600/60"
            >
              Learn more
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
