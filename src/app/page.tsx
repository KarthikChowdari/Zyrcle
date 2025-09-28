"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { BarChart3, FileText, Zap } from "lucide-react";
import BasicUserMenu from "@/components/BasicUserMenu";

export default function HomePage() {
  // Generate Report is now a full feature - no need for handler

  const cards = [
    {
      title: "Quick Compare",
      desc: "Compare primary vs recycled metal pathways with live impact visualization",
      icon: (
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-200 transition-colors">
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
      ),
      list: [
        "Interactive parameter sliders",
        "Real-time GWP & circularity metrics",
        "Sankey flow visualization",
      ],
      link: "/compare",
      buttonText: "Start Comparison",
      buttonClass: "bg-[#122315] hover:bg-green-700",
    },
    {
      title: "Custom Project",
      desc: "Upload your BOM and get AI-assisted LCI data imputation",
      icon: (
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-green-200 transition-colors">
          <Zap className="w-8 h-8 text-green-600" />
        </div>
      ),
      list: [
        "CSV BOM upload",
        "AI-powered data imputation",
        "Editable confidence scores",
      ],
      link: "/project/demo",
      buttonText: "Start Custom Project",
      buttonClass: "bg-[#122315] hover:bg-green-700",
    },
    {
      title: "Generate Report",
      desc: "Export executive summaries and detailed LCI data easily",
      icon: (
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-purple-200 transition-colors">
          <FileText className="w-8 h-8 text-purple-600" />
        </div>
      ),
      list: [
        "One-page executive PDF",
        "Detailed CSV LCI export",
        "Ranked action recommendations",
      ],
      link: "/generate-report",
      buttonText: "Generate Report",
      buttonClass: "bg-[#122315] hover:bg-green-700",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#122315] text-white relative">
      {/* Background Illustration with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
          alt="Kikin background"
          className="w-full h-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-[#122315]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-extrabold"
          >
            Zyrcle
          </motion.h1>
          <div className="flex items-center space-x-4">
            <motion.nav
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="hidden md:block"
            >
              <NavigationMenu>
                <NavigationMenuList>
                  {[
                    { name: "MY PROJECTS", href: "/projects" },
                    { name: "HOW IT WORKS", href: "#" },
                    { name: "PRICING", href: "#" }
                  ].map((item, i) => (
                    <NavigationMenuItem key={item.name}>
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                      >
                        <NavigationMenuLink
                          href={item.href}
                          className="text-sm font-semibold text-white hover:text-green-400 transition-colors"
                        >
                          {item.name}
                        </NavigationMenuLink>
                      </motion.div>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </motion.nav>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="relative"
            >
              <BasicUserMenu />
            </motion.div>
            
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center mt-[-50px] px-6 py-20 flex-1">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl sm:text-7xl font-extrabold leading-tight drop-shadow-lg"
        >
          AI-Assisted LCA <br />
          <span className="text-green-500">
            & Circularity Decisions for Metals
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-6 max-w-2xl text-gray-200 text-lg leading-relaxed"
        >
          Fast, defensible environmental impact and circularity analysis for
          metal production choices. Get instant insights on primary vs recycled
          routes, energy choices, and end-of-life scenarios.
        </motion.p>
      </main>

      {/* Illustration Section */}
      <section className="relative w-full z-0">
        <motion.img
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/654a36b6f78e92b5209148af_Kikin_Illustrations_Scene_01_RGB%202.svg"
          alt="Kikin background"
          className="w-full h-auto mt-[-200px] object-cover"
        />
        <div className="absolute inset-0 bg-[#122315] opacity-40"></div>
      </section>

      {/* Card Section */}

      <section className="relative z-10 bg-[#f8f3e6] text-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-16"
          >
            Explore Our Features
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-10">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <Card
                  className="group bg-white border-2 border-slate-200 shadow-md hover:shadow-xl hover:border-slate-300 transition-all duration-300 rounded-2xl h-[440px] flex flex-col cursor-pointer"
                >
                  {card.link ? (
                    <Link href={card.link} className="h-full flex flex-col">
                      <CardHeader className="text-center pt-8">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center  transition-colors duration-300 ">
                          {card.icon}
                        </div>

                        <CardTitle className="text-2xl font-semibold text-slate-900">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-slate-500  mt-2">
                          {card.desc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between pb-6 pt-2">
                        <ul className="space-y-4 text-base text-slate-700">
                          {card.list.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shadow-sm">
                                ✓
                              </div>
                              <span className="flex-1 leading-relaxed">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full mt-8 font-semibold shadow-md hover:shadow-lg transition ${card.buttonClass}`}
                        >
                          {card.buttonText}
                        </Button>
                      </CardContent>
                    </Link>
                  ) : (
                    <>
                      <CardHeader className="text-center pt-8">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center transition-colors duration-300 ">
                          {card.icon}
                        </div>

                        <CardTitle className="text-2xl font-semibold text-slate-900">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                          {card.desc}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col text-left justify-between pb-6">
                        <ul className="space-y-4 text-base text-slate-700 w-full">
                          {card.list.map((item: string, idx: number) => (
                            <li key={idx} className="flex text-left gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold shadow-sm">
                                ✓
                              </div>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full mt-8 font-semibold shadow-md hover:shadow-lg transition ${card.buttonClass}`}
                        >
                          {card.buttonText}
                        </Button>
                      </CardContent>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-[#122315] text-white mt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://cdn.prod.website-files.com/635273ea37c256ef2835d522/65363617f2f8b421dacfacc5_Illustration.svg"
            alt="Footer Illustration"
            className="w-full h-full object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-[#122315]/80"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 container mx-auto px-6 py-16 grid md:grid-cols-3 gap-10"
        >
          {/* Left */}
          <div>
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              Get in touch
            </h3>
            <p className="text-lg font-semibold">
              <a href="mailto:hello@Zyrcle.io" className="hover:underline">
                hello@Zyrcle.io
              </a>
            </p>
            <div className="mt-6 flex items-center gap-8">
              <div>
                <p className="text-blue-300 font-bold">83,950 kg</p>
                <p className="text-sm text-gray-300">CO₂ offset per year</p>
              </div>
              <div>
                <p className="text-green-300 font-bold">3,358</p>
                <p className="text-sm text-gray-300">new trees planted</p>
              </div>
            </div>
          </div>

          {/* Middle */}
          <div>
            <p className="text-sm text-gray-300 mb-4">
              2023 Zyrcle <br />
              Company no. 14569152 <br />
              Ground Floor, Verse Building, 18 Brunswick Place, London, N1 6DZ
            </p>
          </div>

          {/* Right */}
          <div>
            <ul className="space-y-2 mb-6">
              {[
                "How it works",
                "Pricing",
                "FAQs",
                "Blog",
                "Privacy policy",
                "Terms of service",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-green-400">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative z-10 border-t border-white/20 py-4 text-center text-xs text-gray-400"
        >
            © 2025 Zyrcle. All Rights Reserved. This is a functional prototype for demonstration purposes only.
        </motion.div>
      </footer>
    </div>
  );
}
