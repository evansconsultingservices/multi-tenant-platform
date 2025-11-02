import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: November 1, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Introduction</h3>
              <p className="text-muted-foreground">
                Media Orchestrator ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Information We Collect</h3>

              <h4 className="font-semibold text-sm mt-3 mb-2">2.1 Authentication Information</h4>
              <p className="text-muted-foreground mb-2">
                When you sign in using Google OAuth, we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Your name</li>
                <li>Email address</li>
                <li>Profile picture</li>
                <li>Google account identifier</li>
              </ul>

              <h4 className="font-semibold text-sm mt-3 mb-2">2.2 Profile Information</h4>
              <p className="text-muted-foreground mb-2">
                Information stored in your user profile:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>User role (admin, user, super admin)</li>
                <li>Company/organization association</li>
                <li>Department information</li>
                <li>Phone number (if provided)</li>
                <li>Tool access permissions</li>
              </ul>

              <h4 className="font-semibold text-sm mt-3 mb-2">2.3 Usage Data</h4>
              <p className="text-muted-foreground mb-2">
                We automatically collect certain information when you use the Service:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access logs and timestamps</li>
                <li>Feature usage patterns</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
              </ul>

              <h4 className="font-semibold text-sm mt-3 mb-2">2.4 Content Data</h4>
              <p className="text-muted-foreground">
                Content you create, upload, or manage through the Service, including video assets, podcast episodes, articles, and associated metadata.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">
                We use the collected information for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Providing and maintaining the Service</li>
                <li>Authenticating users and managing access</li>
                <li>Enforcing multi-tenant data isolation</li>
                <li>Improving and optimizing the Service</li>
                <li>Communicating with you about the Service</li>
                <li>Ensuring security and preventing fraud</li>
                <li>Complying with legal obligations</li>
                <li>Generating audit logs for compliance purposes</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Data Storage and Security</h3>

              <h4 className="font-semibold text-sm mt-3 mb-2">4.1 Data Storage</h4>
              <p className="text-muted-foreground">
                Your data is stored using Google Firebase services, which provide enterprise-grade security and reliability. All data is encrypted in transit using TLS/SSL and at rest using industry-standard encryption.
              </p>

              <h4 className="font-semibold text-sm mt-3 mb-2">4.2 Multi-Tenant Isolation</h4>
              <p className="text-muted-foreground">
                We implement strict data isolation between companies. Each company's data is tagged with a unique company identifier and security rules prevent cross-company data access. Users can only access data belonging to their associated company.
              </p>

              <h4 className="font-semibold text-sm mt-3 mb-2">4.3 Security Measures</h4>
              <p className="text-muted-foreground mb-2">
                We implement multiple layers of security:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>256-bit encryption for data in transit and at rest</li>
                <li>Google OAuth 2.0 for authentication</li>
                <li>Role-based access control (RBAC)</li>
                <li>Firestore security rules for data access control</li>
                <li>Regular security audits and monitoring</li>
                <li>Audit logging for compliance tracking</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Data Sharing and Disclosure</h3>

              <h4 className="font-semibold text-sm mt-3 mb-2">5.1 Third-Party Services</h4>
              <p className="text-muted-foreground mb-2">
                We share data with the following third-party services necessary for operation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Google Firebase:</strong> Authentication and data storage</li>
                <li><strong>Vercel:</strong> Application hosting and delivery</li>
                <li><strong>Field59:</strong> Video asset management (if applicable)</li>
              </ul>

              <h4 className="font-semibold text-sm mt-3 mb-2">5.2 Within Your Organization</h4>
              <p className="text-muted-foreground">
                Your data is accessible to other users within your company based on their role and permissions. Company administrators have the ability to manage user access and view company data.
              </p>

              <h4 className="font-semibold text-sm mt-3 mb-2">5.3 Legal Requirements</h4>
              <p className="text-muted-foreground">
                We may disclose your information if required by law, legal process, or government request.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Data Retention</h3>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide the Service. Audit logs may be retained for longer periods to meet compliance requirements. Upon account termination, we will delete or anonymize your personal information within a reasonable timeframe, unless retention is required by law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Your Rights</h3>
              <p className="text-muted-foreground mb-2">
                Depending on your jurisdiction, you may have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, please contact your company administrator or reach out through our support channels.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Cookies and Tracking</h3>
              <p className="text-muted-foreground">
                We use essential cookies and similar technologies for authentication and session management. These are necessary for the Service to function properly. We do not use third-party advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Children's Privacy</h3>
              <p className="text-muted-foreground">
                The Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. International Data Transfers</h3>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Changes to This Privacy Policy</h3>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date and, where appropriate, providing additional notice. Your continued use of the Service after such changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us through the support channels provided in the application.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Compliance</h3>
              <p className="text-muted-foreground">
                We are committed to complying with applicable privacy laws and regulations, including GDPR (General Data Protection Regulation) where applicable. We implement appropriate technical and organizational measures to ensure data protection.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
