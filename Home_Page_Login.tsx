import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Warehouse, ShoppingBag, UserPlus } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 p-6">
      <div className="max-w-sm mx-auto space-y-8">
        {/* Header with Logo */}
        <div className="text-center pt-8 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1754765542024-c1320f23b75a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHBlcnNvbiUyMG1vdG9yY3ljbGUlMjBiaWtlJTIwZ29vZHMlMjBjb3VyaWVyfGVufDF8fHx8MTc1ODI2NjQyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Delivery person on motorcycle"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl text-white drop-shadow-lg tracking-wide">
              Vyapar Mantra
            </h1>
            <p className="text-white/90 drop-shadow-md">
              Your Business we deliver
            </p>
            <div className="w-20 h-0.5 bg-white/60 rounded-full mx-auto"></div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center">
          <h2 className="text-xl text-white drop-shadow-md mb-2">
            Welcome Back!
          </h2>
          <p className="text-white/80 drop-shadow-sm">
            Choose your login type to continue
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          <Card className="bg-white/95 backdrop-blur-sm border-white/30 shadow-xl">
            <div className="p-6 space-y-4">
              <h3 className="text-center text-gray-800 mb-4">
                Login as
              </h3>

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <Warehouse className="mr-2 h-5 w-5" />
                Wholesaler Login
              </Button>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Retailer Login
              </Button>
            </div>
          </Card>

          {/* Register Section */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/30 shadow-xl">
            <div className="p-6 text-center space-y-4">
              <h3 className="text-gray-800">
                New to Vyapar Mantra?
              </h3>
              <Button
                variant="outline"
                className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 shadow-md transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register Your Business
              </Button>
              <p className="text-sm text-gray-600">
                Join thousands of businesses growing with us
              </p>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-white/70 text-sm drop-shadow-sm">
            Connecting businesses, delivering success
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/3 right-12 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 left-8 w-14 h-14 bg-white/10 rounded-full blur-xl"></div>
    </div>
  );
}