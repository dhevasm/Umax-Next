"use client";

import React, { Suspense, useEffect } from "react";
import Navbar from "@/components/Client-components/Navbar";
import dynamic from "next/dynamic";
import TableLoading from "@/components/Client-components/Loading/TableLoading";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
const AccountTable = dynamic(() => import("@/components/Client-components/Table/AccountTable"), {ssr: false,});

const Page = () => {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      Swal.fire("You Must Login First", "Nice Try!", "error").then(() => {
        router.push("/");
      });
    }
  }, [router]);

  return (
    <div className="w-full h-screen bg-white dark:bg-slate-900">
      <Navbar />
      <div className="w-full mt-20 h-fit">
        <div className="w-full h-full md:p-10 p-5 bg-white dark:bg-slate-900">
          <Suspense fallback={<TableLoading />}>
            <AccountTable />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Page;
