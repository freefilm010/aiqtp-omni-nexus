import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, CheckCircle, Eye, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FeedbackManager = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const update: { is_read: boolean; admin_notes?: string } = { is_read: true };
      if (notes) update.admin_notes = notes;
      const { error } = await supabase.from("customer_feedback").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
      setSelectedId(null);
      setAdminNote("");
      toast.success("Feedback updated.");
    },
  });

  const unreadCount = feedback.filter((f: any) => !f.is_read).length;

  const typeColors: Record<string, string> = {
    suggestion: "bg-blue-500/20 text-blue-400",
    review: "bg-green-500/20 text-green-400",
    bug_report: "bg-red-500/20 text-red-400",
    feature_request: "bg-purple-500/20 text-purple-400",
    opinion: "bg-yellow-500/20 text-yellow-400",
  };

  if (isLoading) return <div className="text-muted-foreground p-4">Loading feedback...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Feedback
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} new</Badge>
          )}
        </h2>
      </div>

      {feedback.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No feedback yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {feedback.map((item: any) => (
            <Card key={item.id} className={!item.is_read ? "border-primary/50" : "opacity-75"}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={typeColors[item.feedback_type] || ""}>
                      {item.feedback_type?.replace("_", " ")}
                    </Badge>
                    {!item.is_read && <Badge variant="outline" className="text-xs"><Eye className="h-3 w-3 mr-1" /> Unread</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                {item.subject && <CardTitle className="text-sm mt-1">{item.subject}</CardTitle>}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{item.message}</p>
                {item.rating && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= item.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground">
                  Route: {item.route_hash} · Token: {item.submission_token?.slice(0, 8)}…
                </div>
                {item.admin_notes && (
                  <div className="text-xs bg-muted p-2 rounded"><strong>Admin Note:</strong> {item.admin_notes}</div>
                )}
                {!item.is_read && (
                  <>
                    {selectedId === item.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add internal note (optional)..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => markRead.mutate({ id: item.id, notes: adminNote || undefined })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Mark Read
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>
                        Respond & Mark Read
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackManager;
