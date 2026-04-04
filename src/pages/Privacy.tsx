import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background max-w-2xl mx-auto px-4 py-8 pb-16">
    <Link to="/" className="inline-flex items-center gap-2 text-primary mb-6 text-sm">
      <ArrowLeft className="w-4 h-4" /> Back to App
    </Link>
    <h1 className="font-display text-2xl text-foreground mb-2">Privacy Policy for LA Streetlights</h1>
    <p className="text-sm text-muted-foreground mb-6">Effective Date: April 2, 2025</p>

    <div className="prose prose-sm text-foreground/90 space-y-5">
      <p>LA Streetlights ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.</p>

      <h2 className="font-display text-lg text-foreground">1. Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Personal Information:</strong> such as name, email address, or phone number (only if provided voluntarily)</li>
        <li><strong>Location Data:</strong> to help users find nearby resources (if enabled)</li>
        <li><strong>Usage Data:</strong> such as app interactions and features used</li>
        <li><strong>User-Generated Content:</strong> including tips, messages, or submissions within the app</li>
      </ul>

      <h2 className="font-display text-lg text-foreground">2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide and improve app functionality</li>
        <li>Connect users with relevant local resources</li>
        <li>Respond to support requests or feedback</li>
        <li>Monitor and improve user experience and safety</li>
      </ul>

      <h2 className="font-display text-lg text-foreground">3. User Content & Safety</h2>
      <p>If users submit content (such as tips or messages), we may review, moderate, or remove content that violates our guidelines. We aim to maintain a safe and supportive environment.</p>

      <h2 className="font-display text-lg text-foreground">4. Sharing of Information</h2>
      <p>We do not sell your personal information. We may share information:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>With service providers that help operate the app</li>
        <li>If required by law or to protect users and the public</li>
      </ul>

      <h2 className="font-display text-lg text-foreground">5. Data Security</h2>
      <p>We take reasonable measures to protect your information. However, no system is completely secure.</p>

      <h2 className="font-display text-lg text-foreground">6. Your Choices</h2>
      <p>You can:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Disable location services in your device settings</li>
        <li>Contact us to request deletion of your data</li>
      </ul>

      <h2 className="font-display text-lg text-foreground">7. Children's Privacy</h2>
      <p>LA Streetlights is not intended for children under 13. We do not knowingly collect data from children.</p>

      <h2 className="font-display text-lg text-foreground">8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy. Updates will be posted on this page.</p>

      <h2 className="font-display text-lg text-foreground">9. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at: <a href="mailto:lastreetlight@gmail.com" className="text-primary underline">lastreetlight@gmail.com</a></p>

      <p className="italic text-muted-foreground pt-4">LA Streetlights exists to connect people to hope, help, and real-life resources. Your privacy matters to us.</p>
    </div>

    <footer className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground flex gap-4">
      <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
      <Link to="/support" className="hover:text-primary">Support</Link>
    </footer>
  </div>
);

export default Privacy;
