import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Database,
  Key,
  Cookie,
  Eye,
  Trash,
  BellRinging,
  Envelope,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const scopes = [
  {
    name: "email",
    description:
      "Lets us see the email address on your Google account so we can identify your account, sign you in, and contact you about your uploads when needed.",
  },
  {
    name: "profile",
    description:
      "Lets us see basic profile information from your Google account, such as your name and profile picture, so we can personalize your account and show who uploaded a material.",
  },
  {
    name: "drive.file",
    description:
      "Requested ONLY from the library administrator's account (for storing library files), never from regular members. It lets the app access only the files it creates or uploads to Google Drive for library materials. It cannot see, open, edit, or delete any other files in that Drive.",
  },
];

const collectedData = [
  {
    title: "Name and email address",
    description:
      "Collected when you register or sign in, including when you use Google sign-in. Used to identify your account and communicate with you.",
  },
  {
    title: "Google OAuth profile information",
    description:
      "Basic profile details (such as name and profile picture) received from Google when you sign in with Google.",
  },
  {
    title: "Uploaded materials and metadata",
    description:
      "Files you upload (textbooks, lecture notes, past questions) along with details you provide such as title, course, department, level, and description.",
  },
  {
    title: "Google Drive file IDs for library files",
    description:
      "When a library file is stored in Google Drive, we keep the Drive file ID so the app can locate, list, and serve that specific file for download.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="w-full px-4 pb-16 pt-16 md:px-8 md:pb-20 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex flex-col items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-mint px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
                Privacy and data use
              </span>
              <div className="flex size-14 items-center justify-center rounded-md bg-card shadow-card">
                <ShieldCheck weight="bold" className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              How we collect, use, and protect your information, including how
              Google sign-in and Google Drive are used for the library.
            </p>
            <p className="mt-4 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-muted-foreground">
              Last updated: September 17, 2026
            </p>
          </div>
        </div>
      </section>

      {/* What we collect */}
      <section className="w-full px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-accent-sky text-foreground">
              <Database weight="bold" className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              What data we collect
            </h2>
          </div>
          <div className="space-y-4">
            {collectedData.map((item, index) => (
              <Card key={index} className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-lg tracking-tight">
                    <span className="flex size-7 items-center justify-center rounded-full bg-accent-sky font-mono text-sm font-medium">
                      {index + 1}
                    </span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Google OAuth scopes */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-accent-lavender text-foreground">
              <Key weight="bold" className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Google OAuth scopes we use
            </h2>
          </div>
          <Card className="mb-4 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Regular member sign-in with Google requests only email and
                profile. The drive.file permission listed below is requested
                ONLY from the library administrator&apos;s account (for storing
                library files), never from regular members. We do not request
                full access to any Google account or Google Drive.
              </p>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {scopes.map((scope) => (
              <Card key={scope.name} className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg tracking-tight">
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-medium">
                      {scope.name}
                    </code>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {scope.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4 shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-foreground">
                <strong>Important:</strong> the{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] font-medium">
                  drive.file
                </code>{" "}
                scope is requested ONLY from the library administrator&apos;s
                account for storing library files — never from regular members.
                It means the app can only access files it creates or uploads
                for library materials. It never gives the app access to the rest
                of that Google Drive.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Refresh token */}
      <section className="w-full px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-card">
            <CardHeader>
              <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-accent-blush text-foreground">
                <Key weight="bold" className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Google refresh token storage and revocation
              </CardTitle>
              <CardDescription className="leading-relaxed">
                How we keep your Google connection secure and how you can remove
                it at any time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your Google refresh token is stored securely on our server. It
                is used only to upload and manage library files in Google Drive
                on behalf of the app. It is never exposed to the browser and
                never shared with third parties.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You can revoke the app&apos;s access at any time by going to
                your Google Account, then Security, then Third-party access, and
                removing this app. After revocation, the app can no longer act
                on your Google Drive until you grant access again.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cookies and visibility */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-accent-sand text-foreground">
                <Cookie weight="bold" className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl tracking-tight">
                Cookies and sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use httpOnly authentication cookies to keep you signed in and
                protect your session. These cookies cannot be read by JavaScript
                in your browser, which helps prevent session theft. They are
                used only for authentication and security, not for advertising
                or cross-site tracking.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader>
              <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-accent-mint text-foreground">
                <Eye weight="bold" className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl tracking-tight">
                Who can see uploaded materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Materials you upload to the library are listed in the public
                library and can be viewed and downloaded by any visitor. Do not
                upload private, sensitive, or copyrighted content you do not
                have the right to share.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Retention and changes */}
      <section className="w-full px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-accent-blush text-foreground">
                <Trash weight="bold" className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl tracking-tight">
                Data retention and deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                We keep your account information and uploaded materials for as
                long as your account is active and the library needs them. You
                may request correction or deletion of your personal data or
                removal of materials you uploaded.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To make a deletion request, reach out through our{" "}
                <Link
                  to="/contact"
                  className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
                >
                  contact page
                </Link>{" "}
                and we will review and respond to your request.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader>
              <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-accent-sky text-foreground">
                <BellRinging weight="bold" className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl tracking-tight">
                Changes to this policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We may update this policy when our practices change, for
                example if we add new features or change how we use Google
                services. When we do, we will update the &quot;Last
                updated&quot; date at the top of this page. Continued use of the
                platform after a change means you accept the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="w-full bg-muted/50 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-md bg-card text-primary shadow-card">
              <Envelope weight="bold" className="h-6 w-6" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-lavender px-4 py-1.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.09em]">
              Questions about privacy
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Need help with your data?
          </h2>
          <p className="mx-auto mb-8 mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            If you have questions about this policy or want to request access,
            correction, or deletion of your data, get in touch with us.
          </p>
          <Link
            to="/contact"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
