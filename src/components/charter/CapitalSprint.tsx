import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, Zap, CreditCard, FileText, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: 1,
    title: "Get EIN (Free, Instant)",
    time: "5 minutes",
    icon: FileText,
    description: "Apply as Sole Proprietor — no LLC needed. Free from IRS, instant confirmation online.",
    link: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
    linkLabel: "Apply on IRS.gov",
    tips: [
      "Select 'Sole Proprietor' as entity type",
      "Use your SSN as responsible party",
      "Save the confirmation — you'll need the EIN number immediately",
      "Available Mon–Fri, 7am–10pm ET",
    ],
  },
  {
    step: 2,
    title: "File DBA / Fictitious Name",
    time: "Same day (varies by state)",
    icon: FileText,
    description: "File 'Doing Business As' with your county clerk. Some states allow online filing.",
    link: "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
    linkLabel: "SBA Business Guide",
    tips: [
      "Search your county clerk's website for online DBA filing",
      "Cost: typically $10–$50 depending on county",
      "Some counties process same-day",
      "Gives your business a professional name for credit apps",
    ],
  },
  {
    step: 3,
    title: "Open Business Bank Account",
    time: "Same day online",
    icon: CreditCard,
    description: "Open with EIN + DBA docs. Required for most business credit applications.",
    cards: [
      { name: "Mercury", url: "https://mercury.com", note: "Startup-friendly, instant approval" },
      { name: "Relay", url: "https://relayfi.com", note: "Free, no minimums" },
      { name: "Bluevine", url: "https://bluevine.com", note: "Checking + credit line combo" },
    ],
  },
  {
    step: 4,
    title: "Apply for Business Credit Cards",
    time: "Instant approval possible",
    icon: CreditCard,
    description: "Card stacking — apply to multiple on the same day before inquiries hit your report.",
    cards: [
      { name: "Brex", url: "https://brex.com", note: "No personal guarantee, $0 revenue OK, $10K–$300K" },
      { name: "Ramp", url: "https://ramp.com", note: "No personal guarantee, instant approval" },
      { name: "Divvy (BILL)", url: "https://divvy.co", note: "Net terms + credit line, instant decision" },
      { name: "Amex Blue Business Plus", url: "https://americanexpress.com/us/credit-cards/business/", note: "2x points, instant decision" },
      { name: "Chase Ink Business", url: "https://creditcards.chase.com/business-credit-cards", note: "Large limits, instant decision" },
    ],
  },
  {
    step: 5,
    title: "Cash Flow Credit Lines",
    time: "1–3 days",
    icon: Zap,
    description: "Revenue-based lines that fund fast once bank account shows activity.",
    cards: [
      { name: "Bluevine Line of Credit", url: "https://bluevine.com/line-of-credit", note: "Up to $250K, as fast as same day" },
      { name: "Fundbox", url: "https://fundbox.com", note: "Up to $150K, instant decision" },
      { name: "Kabbage (Amex)", url: "https://kabbage.com", note: "Up to $250K revolving" },
      { name: "OnDeck", url: "https://ondeck.com", note: "Up to $250K, same-day funding available" },
    ],
  },
];

const CapitalSprint = () => {
  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Day Zero Capital Sprint
          </CardTitle>
          <CardDescription>
            EIN → DBA → Bank → Credit Cards → Fund Platform • All same day
          </CardDescription>
        </CardHeader>
      </Card>

      {STEPS.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.step}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">Step {s.step}</Badge>
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.title}
                </CardTitle>
                <Badge className="text-[10px] shrink-0">{s.time}</Badge>
              </div>
              <CardDescription className="text-xs">{s.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.link && (
                <Button size="sm" className="w-full" asChild>
                  <a href={s.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {s.linkLabel}
                  </a>
                </Button>
              )}

              {s.tips && (
                <ul className="space-y-1">
                  {s.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}

              {s.cards && (
                <div className="space-y-1.5">
                  {s.cards.map((card) => (
                    <a
                      key={card.name}
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div>
                        <span className="text-xs font-medium">{card.name}</span>
                        <p className="text-[10px] text-muted-foreground">{card.note}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground text-center">
            💡 Pro tip: Apply to Brex, Ramp, and Divvy on the <strong>same day</strong> before hard inquiries post.
            Combined limits can reach $50K–$100K+ day one. Fund platform deposits via card or bank transfer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalSprint;
