import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Compass, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-12">
      <Helmet>
        <title>Page not found — AEO Improvement</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-7 text-center space-y-5">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
            <p className="text-sm text-muted-foreground mt-2">
              The page you're looking for doesn't exist, was moved, or the link you followed is broken.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                <Home className="h-4 w-4 mr-2" /> Back to home
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                <Mail className="h-4 w-4 mr-2" /> Contact support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
