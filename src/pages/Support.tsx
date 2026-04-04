import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, Bug, HelpCircle, UserX } from "lucide-react";

const Support = () => (
  <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 pb-16">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6 text-sm">
      <ArrowLeft className="w-4 h-4" /> Back to App
    </Link>
    <h1 className="font-display text-2xl text-foreground mb-2">Support — LA Streetlights</h1>
    <p className="text-sm text-muted-foreground mb-8">We're here to help.</p>

    <div className="space-y-6 text-foreground/90 text-sm">
      <section>
        <h2 className="font-display text-lg text-foreground mb-2">About LA Streetlights</h2>
        <p>LA Streetlights is a free mobile-first resource app that connects unhoused and at-risk youth and young adults in Los Angeles with nearby shelters, food, medical care, transitional housing, and safety resources — all in real time.</p>
      </section>

      <section>
        <h2 className="font-display text-lg text-foreground mb-3">How Can We Help?</h2>
        <div className="grid gap-3">
          {[
            { icon: HelpCircle, title: "General Questions", desc: "Questions about how the app works or what resources are available." },
            { icon: Bug, title: "Report a Bug", desc: "Something not working right? Let us know so we can fix it." },
            { icon: UserX, title: "Account Issues", desc: "Problems with notifications, data, or your experience." },
            { icon: MessageCircle, title: "Feedback & Suggestions", desc: "Ideas to make LA Streetlights better for everyone." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 bg-card border border-border rounded-xl p-4">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary/10 border border-primary/20 rounded-xl p-5">
        <h2 className="font-display text-lg text-foreground mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" /> Contact Us
        </h2>
        <p className="mb-3">For any help, bugs, account issues, or questions, email us at:</p>
        <a
          href="mailto:lastreetlight@gmail.com"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium text-sm"
        >
          <Mail className="w-4 h-4" /> lastreetlight@gmail.com
        </a>
        <p className="text-xs text-muted-foreground mt-3">We typically respond within 24–48 hours.</p>
      </section>
    </div>

    <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground flex gap-4">
      <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
      <Link to="/support" className="hover:text-primary">Support</Link>
    </footer>
  </div>
);

export default Support;
