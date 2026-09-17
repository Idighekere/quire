import { Link } from "react-router-dom";
import {
  Heart,
  Lightbulb,
  Target,
  Users,
  BookOpen,
  CheckCircle as CheckCircle2,
  ArrowRight,
  Code,
  GraduationCap,
  Info,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const challenges = [
  {
    title: "Scattered Resources",
    description:
      "Study materials were spread across different platforms, WhatsApp groups, and personal drives, making them hard to find.",
  },
  {
    title: "Accessibility Issues",
    description:
      "Many students, especially freshers, struggled to get access to past questions and lecture notes from senior colleagues.",
  },
  {
    title: "Time Wasted",
    description:
      "Students spent valuable study time searching for materials instead of actually studying them.",
  },
  {
    title: "Inconsistent Quality",
    description:
      "The quality and organization of materials varied greatly, with no standard way to categorize them.",
  },
];

const solutions = [
  {
    title: "Centralized Platform",
    description:
      "All engineering materials in one place, organized by department, level, semester, and course.",
  },
  {
    title: "Easy Search & Filter",
    description:
      "Powerful search functionality to find exactly what you need in seconds.",
  },
  {
    title: "Free Access",
    description:
      "Completely free for all engineering students to access and download materials.",
  },
  {
    title: "Categorized Content",
    description:
      "Materials organized into textbooks, past questions, and lecture notes for easy navigation.",
  },
];

const team = [
  {
    name: "Idighekere Udo",
    role: "Creator & Lead Developer",
    description:
      "Computer Engineering student at University of Uyo with a passion for building solutions that make academic life easier.",
    links: {
      portfolio: "https://idighekereudo.vercel.app",
      linkedin: "https://www.linkedin.com/in/idighekere-udo/",
      twitter: "https://twitter.com/idighekere",
    },
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex flex-col items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-blush px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
                A student initiative
              </span>
              <div className="flex size-14 items-center justify-center rounded-md bg-card shadow-card">
                <Heart weight="bold" className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl">
              About This Project
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              A student-built platform to help engineering students at the
              University of Uyo access study materials easily and efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="w-full px-4 pb-4 md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-4 rounded-lg bg-accent-sand p-6 shadow-card">
            <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-md bg-card text-foreground">
              <Info weight="bold" className="h-5 w-5" />
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              <strong>Disclaimer:</strong> This project was built as an
              independent student initiative before the official NUESA library
              was launched. For the official NUESA UNIUYO library, please visit{" "}
              <a
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
              >
                the official NUESA library
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="w-full px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-sky px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              Our story
            </span>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Why I Built This
            </h2>
          </div>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-md bg-accent-lavender text-foreground">
                  <Lightbulb weight="bold" className="h-5 w-5" />
                </div>
                <div className="space-y-4">
                  <p className="leading-relaxed text-muted-foreground">
                    As a Computer Engineering student at the University of Uyo,
                    I experienced firsthand the struggles of finding study
                    materials. From chasing seniors for past questions to
                    scrolling through endless WhatsApp messages looking for
                    lecture notes, the process was frustrating and
                    time-consuming.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    I realized that if I was facing this challenge, thousands of
                    other engineering students were too. That's when the idea
                    for UNIUYO Engineering Library was born - a centralized
                    platform where all engineering students can access the
                    materials they need, organized by department, level, and
                    semester.
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    This project is my way of giving back to the engineering
                    student community and making academic life just a little bit
                    easier for everyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Challenges */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-md bg-accent-blush text-foreground">
                  <Target weight="bold" className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">The Challenges</h2>
              </div>
              <div className="space-y-4">
                {challenges.map((challenge, index) => (
                  <Card key={index} className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg tracking-tight">
                        <span className="flex size-7 items-center justify-center rounded-full bg-accent-blush font-mono text-sm font-medium">
                          {index + 1}
                        </span>
                        {challenge.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {challenge.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-md bg-accent-mint text-foreground">
                  <CheckCircle2 weight="bold" className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Our Solutions</h2>
              </div>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <Card key={index} className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-lg tracking-tight">
                        <span className="flex size-7 items-center justify-center rounded-full bg-accent-mint font-mono text-sm font-medium">
                          {index + 1}
                        </span>
                        {solution.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {solution.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="w-full px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-mint px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              The team
            </span>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Meet the Creator
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Built with passion by engineering students, for engineering
              students.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {team.map((member, index) => (
              <Card key={index} className="text-center shadow-card md:mx-auto md:w-full">
                <CardHeader>
                  <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-accent-sky text-foreground">
                    {index === 0 ? (
                      <Code weight="bold" className="h-8 w-8 text-primary" />
                    ) : (
                      <Users weight="bold" className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-primary">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {member.description}
                  </p>
                  {member.links && (
                    <div className="flex flex-wrap justify-center gap-2">
                      <a
                        href={member.links.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                          Portfolio
                        </Badge>
                      </a>
                      <a
                        href={member.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                          LinkedIn
                        </Badge>
                      </a>
                      <a
                        href={member.links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                          Twitter
                        </Badge>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-md bg-card text-primary shadow-card">
              <BookOpen weight="bold" className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-lavender px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              Get started
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Ready to Start Learning?
          </h2>
          <p className="mx-auto mb-8 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Explore course materials from all eight engineering departments.
            Find textbooks, past questions, and lecture notes for your courses.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/courses">
              <Button size="lg" className="w-full sm:w-auto">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/departments">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <GraduationCap className="mr-2 h-4 w-4" />
                Explore Departments
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}