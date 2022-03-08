import Image from "next/image";
import Link from "next/link";
import React from "react";

const Layout: React.FC = ({ children }) => {
  return (
    <div className="page">
      <Link href="/">
        <a>
          <img src="/logo.png" alt="logo" className="logo" />
        </a>
      </Link>
      {children}
    </div>
  );
};

export default Layout;
