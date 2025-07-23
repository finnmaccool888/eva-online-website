import Navbar from "@/components/navbar";

export default function TermsPage() {
  return (
    <div className="relative bg-[#F1E3EB] min-h-screen">
      <div className="p-4">
        <Navbar inverse />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 text-[#48333D]">
        <h1 className="text-3xl lg:text-4xl font-bold uppercase mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <p className="font-semibold">Effective Date: July 1, 2025</p>

          <p>
            Welcome to Eva (&ldquo;Eva&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) at www.evaonline.xyz. By accessing or using our platform, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). Please read them carefully.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-3">1. Overview</h2>
            <p>
              Eva is a decentralized identity protocol for AI agents. It enables users to create, manage, and evolve intelligent agent personas (&ldquo;Agents&rdquo;) using AI, blockchain, and social data layers. Eva operates on the Virtuals platform and offers persistent digital identities, interoperable agent frameworks, and tools for creators and developers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use Eva. If you are under the age of majority in your jurisdiction, you may only use Eva with the consent of a parent or legal guardian.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. User Accounts</h2>
            <p>
              You may be required to connect a wallet, create an account, or verify your identity to access certain features. You are responsible for all activities under your account or wallet connection. Never share your private keys or login credentials with anyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. User-Generated Content & Agents</h2>
            <p>By creating or evolving Agents, uploading data, or interacting with Eva:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain ownership of your content but grant Eva a global, royalty-free license to use, reproduce, adapt, and display it for platform operation and promotion.</li>
              <li>You confirm that your content does not violate any laws or infringe on intellectual property rights.</li>
              <li>You acknowledge that AI-generated outputs may reflect your data, input prompts, and behavior, and agree to use such tools ethically and responsibly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Intellectual Property</h2>
            <p>
              All Eva software, branding, and content (excluding user-generated content) are the property of Eva or its licensors. You may not copy, distribute, reverse engineer, or create derivative works without written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use Eva for illegal, abusive, or malicious purposes.</li>
              <li>Upload or generate content that is hateful, deceptive, or infringes on others&rsquo; rights.</li>
              <li>Attempt to exploit or disrupt the platform or its infrastructure.</li>
              <li>Impersonate any individual or Agent in a misleading way.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Blockchain Interactions</h2>
            <p>Eva may leverage blockchain networks and smart contracts to register identity traits, Agent actions, or enable transactions. You agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Transactions are irreversible and public.</li>
              <li>Eva is not responsible for losses due to gas fees, blockchain malfunctions, or third-party services.</li>
              <li>You must comply with any token, agent, or wallet terms set forth on chain.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Disclaimers</h2>
            <p>
              Eva is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Availability, accuracy, or performance of any AI or identity services.</li>
              <li>Security or error-free operation.</li>
              <li>Fitness of Agents for any particular use case.</li>
            </ul>
            <p>Use of Eva and associated tools is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Eva and its affiliates shall not be liable for any indirect, incidental, special, or consequential damages, including data loss, identity exposure, or reputational harm arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to Eva at our sole discretion, especially if you violate these Terms or harm the platform or community.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Modifications</h2>
            <p>
              We may update these Terms from time to time. Changes will be effective upon posting. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of [Insert Jurisdiction], without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">13. Contact</h2>
            <p>
              For questions, issues, or legal notices, contact: 📧 support@evaonline.xyz
            </p>
          </section>
        </div>

        <div className="text-sm text-center mt-12">
          COPYRIGHT © 2025 EVA ONLINE
        </div>
      </div>
    </div>
  );
}