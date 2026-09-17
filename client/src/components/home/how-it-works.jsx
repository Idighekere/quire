import { steps } from "@/constants";
import { cn } from "@/lib/utils";

export default function HowItWorks({
  title = "From search to download in four steps",
  description = "Follow these simple steps to find and access the engineering courses you need.",

}) {
  return (
    <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex max-w-2xl flex-col items-start gap-4 md:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-sky px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
            How it works
          </span>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            {description}
          </p>
        </div>

        <div className="grid gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={cn(
                "flex flex-col items-center gap-8 md:flex-row md:gap-16",
                index % 2 === 1 && "md:flex-row-reverse"
              )}
            >
              <div className="flex w-full flex-1 flex-col items-start gap-5 rounded-lg border bg-card p-6 shadow-card md:p-8">
                <span className="font-mono text-5xl font-medium leading-none tracking-tight text-muted-foreground/60">
                  {String(step.number).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {step.image && (
                <div className="w-full flex-1">
                  <div className="relative overflow-hidden rounded-lg border shadow-card">
                    <img
                      src={step.image || "/placeholder.svg"}
                      alt={`Step ${step.number}: ${step.title}`}
                      width={400}
                      height={300}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}