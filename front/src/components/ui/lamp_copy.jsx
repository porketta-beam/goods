"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";

export default function LampDemo() {
  return (
    <LampContainer>
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl">
        Bear Guard <br />
        <button 
          onClick={() => window.location.href = '/dashboard'} 
          className="p-[3px] mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="px-8 py-2  bg-black   relative group transition duration-200 text-white hover:bg-transparent text-sm font-semibold tracking-widest">
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRightIcon className="w-4 h-4" />
            </span>
          </div>
        </button>
      </motion.h1>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 w-full z-0",
        className
      )}>
      
      {/* Bear Image - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -100, y: -50 }}
        whileInView={{ opacity: 0.6, x: 0, y: 0 }}
        transition={{
          delay: 0.5,
          duration: 1,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 z-10 w-160 h-160 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 80%)"
        }}>
        <img 
          src="/bear.png" 
          alt="Bear" 
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Man Image - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, x: 100, y: 50 }}
        whileInView={{ opacity: 0.6, x: 0, y: 0 }}
        transition={{
          delay: 0.7,
          duration: 1,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-0 z-10 w-160 h-160 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 80%)"
        }}>
        <img 
          src="/man.png" 
          alt="Man" 
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      <div
        className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 ">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]">
          <div
            className="absolute  w-[100%] left-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div
            className="absolute  w-40 h-[100%] left-0 bg-slate-950  bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top]">
          <div
            className="absolute  w-40 h-[100%] right-0 bg-slate-950  bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div
            className="absolute  w-[100%] right-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div
          className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl"></div>
        <div
          className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div
          className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 bg-cyan-500 opacity-50 blur-3xl"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] bg-cyan-400 blur-2xl"></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-cyan-400 "></motion.div>

        <div
          className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950 "></div>
      </div>
      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};