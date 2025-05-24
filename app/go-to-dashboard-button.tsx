"use client";

import { redirect } from "next/navigation";

export default function GoToDashboardButton() {
  const handleGoToDashboard = () => {
    redirect("/dashboard");
  };

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <p>Click the button below to go to the dashboard</p>
      <button className="btn btn-accent" onClick={handleGoToDashboard}>
        Go to Dashboard
      </button>
    </div>
  );
}
