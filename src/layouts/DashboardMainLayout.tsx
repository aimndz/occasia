import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { SidebarTrigger } from "../components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useUser } from "../hooks/use-user";
import { logout } from "../services/authApi";
import { Link } from "react-router-dom";

function DashboardMainLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { user } = useUser();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="w-full">
      <header className="flex w-full justify-between gap-3 px-5 py-8">
        <div className="flex items-center justify-center gap-3">
          <SidebarTrigger />
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage
                src="https://avatars.githubusercontent.com/u/112063710?v=4"
                alt="@shadcn"
              />
              <AvatarFallback className="uppercase">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs font-normal text-secondary-800">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {" "}
              <Link to={"/dashboard/profile"}> Profile </Link>{" "}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="w-full bg-secondary-200 px-5 pb-5">{children}</main>
    </div>
  );
}

export default DashboardMainLayout;
