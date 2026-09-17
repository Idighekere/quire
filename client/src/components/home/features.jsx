import { features } from "@/constants"

const accentWashes = [
  "bg-accent-lavender",
  "bg-accent-mint",
  "bg-accent-sand",
  "bg-accent-sky",
  "bg-accent-blush",
]

export default function Features({
  title = "Built around the way engineers study",
  description = "Our engineering library offers a range of features to enhance your academic experience.",

}) {
  return (
    <section className="w-full px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex max-w-2xl flex-col items-start gap-4 md:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-lavender px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
            Library features
          </span>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const wash = accentWashes[index % accentWashes.length]
            return (
              <div
                key={feature.title}
                className={`${wash} flex flex-col gap-5 rounded-lg p-6 shadow-card transition-shadow duration-150 ease-nuesa hover:shadow-soft-lift`}
              >
                <div className="flex size-11 items-center justify-center rounded-md bg-card text-foreground shadow-card">
                  <Icon weight="bold" className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}