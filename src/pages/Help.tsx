import { Search } from "lucide-react";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";
import MarkdownLite from "@/components/MarkdownLite";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { DEFAULT_HELP } from "@/lib/defaultContent";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();
  const { data: settings } = useSiteSettings();
  const storedHelp: any = (settings as any)?.help_content;
  const helpText =
    typeof storedHelp === "string" ? storedHelp : storedHelp?.text || DEFAULT_HELP;

  const faqs = {
    guests: [
      {
        question: "How do I book a property?",
        answer: "Browse available properties, select your dates, and click 'Book Now'. You'll be guided through the booking process where you can review details and make payment."
      },
      {
        question: "What is the cancellation policy?",
        answer: "Cancellation policies vary by property. You can find the specific policy on each property listing page. Generally, free cancellation is available up to 48 hours before check-in."
      },
      {
        question: "How do I contact a host?",
        answer: "Once you've made a booking, you can message the host directly through our messaging system. Go to 'Messages' in your dashboard to start a conversation."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express) and some local payment methods depending on your region."
      },
    ],
    hosts: [
      {
        question: "How do I list my property?",
        answer: "Click 'Host Dashboard' from the menu, then select 'Add Listing'. Fill in your property details, upload photos, set your pricing and availability, and submit for review."
      },
      {
        question: "What are the hosting fees?",
        answer: "We charge a 15% service fee on each booking. This covers payment processing, customer support, and platform maintenance."
      },
      {
        question: "How do I get verified as a host?",
        answer: "Go to 'Verification' in your Host Dashboard. Upload a government-issued ID and proof of address. Verification typically takes 24-48 hours."
      },
      {
        question: "When do I receive payment?",
        answer: "Payments are released 24 hours after guest check-in. Funds are transferred to your linked bank account within 3-5 business days."
      },
    ],
    general: [
      {
        question: "Is my personal information secure?",
        answer: "Yes, we use industry-standard encryption and security measures to protect your data. We never share your personal information with third parties without your consent."
      },
      {
        question: "How do I change my account settings?",
        answer: "Click on your profile icon in the header, then select 'Account Settings'. From there, you can update your personal information, password, and payment methods."
      },
      {
        question: "What if I have an issue during my stay?",
        answer: "Contact your host immediately through our messaging system. If the issue isn't resolved, reach out to our support team through the 'Contact Us' page for assistance."
      },
    ],
  };

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("helpCenter")}</h1>
          <p className="text-muted-foreground mb-8">{t("helpDesc")}</p>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("searchHelp")}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              <MarkdownLite text={helpText} />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("forGuests")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.guests.map((faq, index) => (
                  <AccordionItem key={index} value={`guest-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("forHosts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.hosts.map((faq, index) => (
                  <AccordionItem key={index} value={`host-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("generalQuestions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.general.map((faq, index) => (
                  <AccordionItem key={index} value={`general-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-secondary/50 rounded-lg text-center">
            <p className="text-muted-foreground mb-4">{t("stillNeedHelp")}</p>
            <a href="/contact" className="text-primary hover:underline font-medium">
              {t("contactSupport")}
            </a>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Help;
