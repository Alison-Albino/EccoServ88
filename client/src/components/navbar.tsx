import { Button } from "@/components/ui/button";
import { Droplet, LogOut, User, ShieldQuestion } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, logout } = useAuth();

  const getUserIcon = () => {
    if (user?.userType === 'admin') {
      return <ShieldQuestion className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Droplet className="text-white h-4 w-4" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">EccoServ</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {getUserIcon()}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
