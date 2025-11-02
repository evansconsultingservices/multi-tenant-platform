import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsOfServiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: November 1, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using Media Orchestrator ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">2. Description of Service</h3>
              <p className="text-muted-foreground">
                Media Orchestrator is a multi-tenant SaaS platform that provides media management tools including video asset management, podcast management, and related services. The Service is provided on a subscription basis and is subject to the features and limitations of your selected plan.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">3. User Accounts</h3>
              <p className="text-muted-foreground mb-2">
                To access the Service, you must:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Authenticate using a valid Google account</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be authorized by your organization to access the Service</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">4. Company Accounts and Multi-Tenancy</h3>
              <p className="text-muted-foreground">
                The Service operates on a multi-tenant architecture where each company has isolated data and access controls. Users are associated with a specific company and can only access data belonging to their company. Company administrators are responsible for managing user access and permissions within their organization.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">5. Acceptable Use</h3>
              <p className="text-muted-foreground mb-2">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Upload or distribute content that infringes intellectual property rights</li>
                <li>Attempt to gain unauthorized access to other companies' data</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Upload malicious code, viruses, or harmful content</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">6. Content and Intellectual Property</h3>
              <p className="text-muted-foreground">
                You retain all rights to the content you upload to the Service. By uploading content, you grant us a limited license to store, process, and display your content solely for the purpose of providing the Service. We claim no ownership over your content. You are responsible for ensuring you have the necessary rights and permissions for any content you upload.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">7. Data Security and Privacy</h3>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure. You acknowledge that you provide data at your own risk. For more information, please review our Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">8. Third-Party Services</h3>
              <p className="text-muted-foreground">
                The Service integrates with third-party services including Google OAuth for authentication, Field59 for video management, and FTP services for file transfer. Your use of these services is subject to their respective terms and conditions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">9. Service Availability</h3>
              <p className="text-muted-foreground">
                While we strive to provide continuous availability, we do not guarantee that the Service will be uninterrupted or error-free. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">10. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Media Orchestrator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">11. Termination</h3>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason. Upon termination, your right to use the Service will immediately cease. You may terminate your account at any time by contacting your company administrator.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">12. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">13. Governing Law</h3>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service operator is located, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">14. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through the support channels provided in the application.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
