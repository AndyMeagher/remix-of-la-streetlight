import { Phone, MessageCircle } from "lucide-react";

const SOSPanel = () => {
  return (
    <div className="px-4 pt-6 pb-24">
      <h2 className="font-display text-xl text-foreground mb-2">Emergency Support</h2>
      <p className="text-sm text-muted-foreground mb-6">
        You are not alone. These lines are free, confidential, and available 24/7.
      </p>

      <div className="space-y-3">
        <a
          href="tel:18007862929"
          className="flex items-center gap-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 active:bg-destructive/20 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-sm text-foreground">National Runaway Safeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">1-800-786-2929 • 24/7</p>
          </div>
        </a>

        <a
          href="sms:233733&body=HELLO"
          className="flex items-center gap-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 active:bg-destructive/20 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-sm text-foreground">Crisis Text Line</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Text HELLO to 233733</p>
          </div>
        </a>

        <a
          href="tel:988"
          className="flex items-center gap-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 active:bg-destructive/20 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-sm text-foreground">988 Suicide & Crisis Lifeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Call or text 988 • 24/7</p>
          </div>
        </a>

        <a
          href="tel:2132217646"
          className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-xl p-4 active:bg-primary/20 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm text-foreground">LA Youth Hotline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">(213) 221-7646</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default SOSPanel;
