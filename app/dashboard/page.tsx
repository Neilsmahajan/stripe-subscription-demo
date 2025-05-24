import { auth } from "@/auth";
import SignInButton from "@/components/sign-in-button";
import CheckoutButton from "./checkout-button";

export default async function Dashboard() {
  const session = await auth();
  if (!session) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>You are not signed in</p>
        <SignInButton />
      </div>
    );
  }
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name}</p>
      <p>Your email: {session.user?.email}</p>
      <p>Your ID: {session.user?.id}</p>
      <CheckoutButton />
    </div>
  );
}
