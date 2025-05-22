import Link from "next/link";
import styles from "./navbar.module.css";
import Image from "next/image";
import SignInButton from "@/components/sign-in-button";
import SignOutButton from "@/components/sign-out-button";
import AuthCheck from "@/components/auth-check";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link href={"/"}>
        <Image
          src="/logo.svg" // Route of the image file
          width={216}
          height={30}
          alt="NextSpace Logo"
        />
      </Link>
      <ul className={styles.links}>
        <li>
          <Link href={"/about"}>About</Link>
        </li>
        <li>
          <Link href={"/blog"}>Blog</Link>
        </li>
        <li>
          <Link href={"/users"}>Users</Link>
        </li>
        <li>
          <SignInButton />
        </li>

        <li>
          <AuthCheck>
            <SignOutButton />
          </AuthCheck>
        </li>
      </ul>
    </nav>
  );
}
