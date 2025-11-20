import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navbar = () => {
  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold hover:text-gray-200 transition-colors">
          ResumePivot
        </NavLink>
        <div className="flex space-x-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "text-lg font-medium hover:text-gray-200 transition-colors",
                isActive && "underline underline-offset-4",
              )
            }
          >
            Master Resume
          </NavLink>
          <NavLink
            to="/job-descriptions"
            className={({ isActive }) =>
              cn(
                "text-lg font-medium hover:text-gray-200 transition-colors",
                isActive && "underline underline-offset-4",
              )
            }
          >
            Job Descriptions
          </NavLink>
          <NavLink
            to="/generate-application"
            className={({ isActive }) =>
              cn(
                "text-lg font-medium hover:text-gray-200 transition-colors",
                isActive && "underline underline-offset-4",
              )
            }
          >
            Generate Application
          </NavLink>
          <NavLink
            to="/my-applications"
            className={({ isActive }) =>
              cn(
                "text-lg font-medium hover:text-gray-200 transition-colors",
                isActive && "underline underline-offset-4",
              )
            }
          >
            My Applications
          </NavLink>
          {/* Add more navigation links here as features are added */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;