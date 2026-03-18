import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquarePlus, Star, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  { value: "suggestion", label: "Suggestion" },
  { value: "review", label: "Review" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "opinion", label: "General Opinion" },
];

const CustomerFeedbackForm = () => {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter your feedback message.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Please provide at least 10 characters of feedback.");
      return;
    }
    if (message.trim().length > 2000) {
      toast.error("Feedback must be under 2000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("customer_feedback").insert({
        feedback_type: feedbackType,
        subject: subject.trim() || null,
        message: message.trim(),
        rating: rating > 0 ? rating : null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you! Your feedback has been received.");
      
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFeedbackType("suggestion");
        setSubject("");
        setMessage("");
        setRating(0);
      }, 2500);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Share Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Share Your Thoughts
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">Thank you!</p>
            <p className="text-sm text-muted-foreground text-center">
              Your feedback has been securely routed to our team. We appreciate your input.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us improve AIQTP™. Your feedback is encrypted and securely routed.
            </p>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Brief topic..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Your Feedback</Label>
              <Textarea
                placeholder="Tell us what you think, suggest improvements, or report issues..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>

            <div className="space-y-2">
              <Label>Rating <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Submissions are anonymous and securely routed. No personal data is collected unless voluntarily provided.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFeedbackForm;
