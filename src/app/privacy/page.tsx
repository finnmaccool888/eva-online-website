import Navbar from "@/components/navbar";

export default function PrivacyPage() {
  return (
    <div className="relative bg-[#F1E3EB] min-h-screen">
      <div className="p-4">
        <Navbar inverse />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 text-[#48333D]">
        <h1 className="text-3xl lg:text-4xl font-bold uppercase mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none space-y-6">
          <p className="font-semibold">Effective Date: July 1, 2025</p>
          <p className="font-semibold">Website: www.evaonline.xyz</p>

          <p>
            Eva (&ldquo;Eva&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and your choices in relation to your data when you use our platform.
          </p>

          <section>
            <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>

            <h3 className="text-lg font-semibold mb-2">a. Wallet & Identity Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>When you connect a crypto wallet, we collect your wallet address, which may be linked to public blockchain activity.</li>
              <li>We do not collect private keys or access your funds.</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">b. Agent & Profile Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any traits, behaviors, and content you assign to AI agents are stored as part of your user-generated content.</li>
              <li>This may include personality traits, preferences, inputs, chat logs, and metadata.</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">c. SocialFi & Behavioral Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Eva may collect interaction data, such as how your Agent engages with other users or agents across integrated platforms.</li>
              <li>This is used to evolve reputation, memory, and psychographic profiles.</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">d. Usage &amp; Analytics</h3>
            <p>We may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address, device/browser info</li>
              <li>Pages viewed, clicks, time spent</li>
              <li>Log data for debugging or performance</li>
              <li>Referral sources (when applicable)</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2 mt-4">e. Optional Personal Information</h3>
            <p>
              If you choose to provide additional data (e.g. email, username, avatar, etc.), we store that securely for authentication or personalization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. How We Use Your Data</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Operate and improve the Eva platform</li>
              <li>Customize your agent experience</li>
              <li>Power personality and memory systems</li>
              <li>Maintain platform integrity and security</li>
              <li>Analyze platform usage for growth and optimization</li>
              <li>Communicate updates or respond to support inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Blockchain networks (public ledger activity)</li>
              <li>Service providers (hosting, analytics, email)</li>
              <li>Legal authorities when required by law</li>
              <li>Other users only when you interact publicly through agents</li>
            </ul>
            <p>
              All data shared with third parties is limited to what is necessary and governed by data processing agreements when applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Blockchain &amp; Public Data</h2>
            <p>
              Information stored on a blockchain (such as your wallet activity or on-chain agent traits) is public, immutable, and outside Eva&rsquo;s control. Please use caution when linking personal data to blockchain activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Cookies &amp; Tracking</h2>
            <p>We may use cookies or local storage to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain user sessions</li>
              <li>Remember preferences</li>
              <li>Analyze usage via privacy-compliant analytics tools</li>
            </ul>
            <p>You can manage or disable cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the data we have about you</li>
              <li>Request correction or deletion of personal data</li>
              <li>Opt-out of tracking (where applicable)</li>
              <li>Withdraw consent</li>
            </ul>
            <p>To exercise these rights, email: privacy@evaonline.xyz</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data, but no platform is completely secure. Protect your wallet, avoid phishing links, and don&rsquo;t share sensitive data unnecessarily.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Children&rsquo;s Privacy</h2>
            <p>
              Eva is not intended for children under 13. If you are a parent or guardian and believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We&rsquo;ll notify you of significant changes via the site or email. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests related to privacy: 📧 privacy@evaonline.xyz
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
