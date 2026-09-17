import { Book, BookOpen, Plus, UploadSimple as Upload, Users } from "@phosphor-icons/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts"
import { cn } from "@/lib/utils"

/**
 * Welcome component for the dashboard home page
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - User object containing role information
 */
function DashboardHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          Dashboard
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || "User"}!</h1>
        <p className="text-muted-foreground">
          Manage your library resources and help students access educational materials.
        </p>
      </div>

      {/* //NOTE - Stats Cards. It is hidden */}
      <div className="hidden gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Books"
          value="24"
          description="Across all courses"
          icon={<Book className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Courses"
          value="12"
          description="From all departments"
          icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        />
        <StatsCard
          title="Active Users"
          value="156"
          description="Students using the library"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <h2 className="mt-8 mb-4 text-xl font-semibold tracking-tight">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Manage Books"
          description="Upload, edit, or delete books from the library."
          wash="bg-accent-lavender"
          icon={<Book weight="bold" className="h-5 w-5 text-primary" />}
          actions={<Button onClick={() => navigate("/dashboard/books")}>Go to Books</Button>}
        />

        {isAdmin && (
          <ActionCard
            title="Manage Courses"
            description="Add, edit, or remove courses from the library."
            wash="bg-accent-mint"
            icon={<BookOpen weight="bold" className="h-5 w-5 text-primary" />}
            actions={<Button onClick={() => navigate("/dashboard/courses")}>Go to Courses</Button>}
          />
        )}
      </div>

      {/* How To Guides */}
      <h2 className="mt-8 mb-4 text-xl font-semibold tracking-tight">How To Guides</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GuideCard
          title="How to Add Books"
          steps={[
            "Navigate to the Books section",
            "Click 'Add New Book' button",
            "Fill in the book details",
            "Provide a Google Drive link",
            "Submit the form",
          ]}
          wash="bg-accent-lavender"
          icon={<Plus weight="bold" className="h-5 w-5 text-primary" />}
          actionText="Add a Book"
          onAction={() => navigate("/dashboard/books")}
        />

        {isAdmin && (
          <GuideCard
            title="How to Add Courses"
            steps={[
              "Navigate to the Courses section",
              "Click 'Add New Course' button",
              "Enter course code and title",
              "Select departments, level, and semester",
              "Submit the form",
            ]}
            wash="bg-accent-sky"
            icon={<Plus weight="bold" className="h-5 w-5 text-primary" />}
            actionText="Add a Course"
            onAction={() => navigate("/dashboard/courses")}
          />
        )}

        <GuideCard
          title="How to Upload Files"
          steps={[
            "Upload your file to Google Drive",
            "Set sharing permissions to 'Anyone with the link'",
            "Copy the sharing link",
            "Use this link when adding a new book",
          ]}
          wash="bg-accent-sand"
          icon={<Upload weight="bold" className="h-5 w-5 text-primary" />}
          actionText="Learn More"
          onAction={() => window.open("https://support.google.com/drive/answer/2494822", "_blank")}
        />
      </div>
    </div>
  )
}

/**
 * Statistics card component
 */
function StatsCard({ title, value, description, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Action card component with icon and buttons
 */
function ActionCard({ title, description, wash, icon, actions }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div className={cn("flex size-11 flex-shrink-0 items-center justify-center rounded-md", wash, "text-foreground")}>
            {icon}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="pt-2">{actions}</CardFooter>
    </Card>
  )
}

/**
 * Guide card component with steps
 */
function GuideCard({ title, steps, wash, icon, actionText, onAction }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-md", wash, "text-foreground")}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ol className="space-y-1.5">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-px font-mono text-xs font-medium text-foreground/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={onAction}>
          {actionText}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default DashboardHome