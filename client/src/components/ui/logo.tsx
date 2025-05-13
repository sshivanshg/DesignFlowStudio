import { Link } from "wouter";

export function Logo() {
  return (
    <Link href="/dashboard">
      <div className="flex items-center space-x-2 cursor-pointer">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-lg">ID</span>
        </div>
        <span className="text-lg font-semibold">InteriDesign</span>
      </div>
    </Link>
  );
}
