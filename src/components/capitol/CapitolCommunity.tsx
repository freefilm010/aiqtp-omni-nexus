import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Heart,
  Send,
  BarChart2,
  TrendingUp,
  Hash,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Flame,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  post_type: string;
  title: string;
  content: string;
  ticker: string | null;
  chart_url: string | null;
  image_url: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

const POST_TYPES = [
  { value: "discussion", label: "Discussion", icon: MessageSquare },
  { value: "chart_analysis", label: "Chart Analysis", icon: BarChart2 },
  { value: "trade_idea", label: "Trade Idea", icon: TrendingUp },
  { value: "debate", label: "Debate", icon: Flame },
];

const CapitolCommunity = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sortBy, setSortBy] = useState<"hot" | "new">("hot");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Compose state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTicker, setNewTicker] = useState("");
  const [newPostType, setNewPostType] = useState("discussion");
  const [newTags, setNewTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const query = supabase
      .from("capitol_community_posts")
      .select("*")
      .order(sortBy === "hot" ? "likes_count" : "created_at", { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch posts:", error);
      return;
    }

    // Fetch profile names for post authors
    const userIds = [...new Set((data || []).map((p) => p.user_id))];
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        }
      }
    }

    setPosts(
      (data || []).map((p) => ({
        ...p,
        profiles: profileMap[p.user_id] || null,
      })) as Post[]
    );
    setLoading(false);
  }, [sortBy]);

  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("capitol_community_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .not("post_id", "is", null);
    if (data) {
      setUserLikes(new Set(data.map((l: any) => l.post_id)));
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchUserLikes();

    const channel = supabase
      .channel("capitol-community-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "capitol_community_posts" }, () =>
        fetchPosts()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "capitol_community_comments" }, () => {
        if (expandedPost) fetchComments(expandedPost);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts, fetchUserLikes]);

  const fetchComments = async (postId: string) => {
    const { data } = await supabase
      .from("capitol_community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) return;

    const userIds = [...new Set(data.map((c) => c.user_id))];
    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        }
      }
    }

    setComments((prev) => ({
      ...prev,
      [postId]: data.map((c) => ({ ...c, profiles: profileMap[c.user_id] || null })) as Comment[],
    }));
  };

  const handleToggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) fetchComments(postId);
    }
  };

  const handleSubmitPost = async () => {
    if (!user) { toast.error("Sign in to post"); return; }
    if (!newTitle.trim() || !newContent.trim()) { toast.error("Title and content required"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("capitol_community_posts").insert({
      user_id: user.id,
      post_type: newPostType,
      title: newTitle.trim(),
      content: newContent.trim(),
      ticker: newTicker.trim() || null,
      tags: newTags ? newTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });

    if (error) {
      toast.error("Failed to create post");
      console.error(error);
    } else {
      toast.success("Post published!");
      setNewTitle(""); setNewContent(""); setNewTicker(""); setNewTags("");
      setShowCompose(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const handleSubmitComment = async (postId: string) => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const text = commentText[postId]?.trim();
    if (!text) return;

    const { error } = await supabase.from("capitol_community_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    if (!error) {
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
      // Increment count locally
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }

    if (userLikes.has(postId)) {
      await supabase.from("capitol_community_likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setUserLikes((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p)));
    } else {
      await supabase.from("capitol_community_likes").insert({ user_id: user.id, post_id: postId });
      setUserLikes((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p)));
    }
  };

  const getPostTypeInfo = (type: string) => POST_TYPES.find((t) => t.value === type) || POST_TYPES[0];
  const getInitials = (name: string | null | undefined) => (name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "??");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === "hot" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("hot")}
            className="text-xs h-8"
          >
            <Flame className="h-3.5 w-3.5 mr-1" /> Hot
          </Button>
          <Button
            variant={sortBy === "new" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy("new")}
            className="text-xs h-8"
          >
            <Clock className="h-3.5 w-3.5 mr-1" /> New
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowCompose(!showCompose)} className="h-8">
          {showCompose ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showCompose ? "Cancel" : "New Post"}
        </Button>
      </div>

      {/* Compose */}
      {showCompose && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {POST_TYPES.map((pt) => (
                <Button
                  key={pt.value}
                  variant={newPostType === pt.value ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setNewPostType(pt.value)}
                >
                  <pt.icon className="h-3 w-3 mr-1" /> {pt.label}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Post title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-background"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Ticker (e.g. NVDA)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                className="bg-background w-32"
              />
              <Input
                placeholder="Tags (comma separated)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="bg-background flex-1"
              />
            </div>
            <Textarea
              placeholder="Share your analysis, chart insight, or start a debate..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="bg-background min-h-[100px]"
            />
            <Button onClick={handleSubmitPost} disabled={submitting} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Publishing..." : "Publish Post"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-2">
          {posts.map((post) => {
            const typeInfo = getPostTypeInfo(post.post_type);
            const TypeIcon = typeInfo.icon;
            const isExpanded = expandedPost === post.id;
            const postComments = comments[post.id] || [];
            const profileData = post.profiles as { full_name: string | null; avatar_url: string | null } | null;

            return (
              <Card key={post.id} className="border-border/50 bg-card hover:border-border transition-colors">
                <CardContent className="pt-4 pb-3 space-y-2">
                  {/* Author line */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(profileData?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">
                      {profileData?.full_name || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-auto">
                      <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
                      {typeInfo.label}
                    </Badge>
                  </div>

                  {/* Title & ticker */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">
                      {post.ticker && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mr-1.5 font-mono">
                          ${post.ticker}
                        </Badge>
                      )}
                      {post.title}
                    </h3>
                  </div>

                  {/* Content */}
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-primary/70 flex items-center">
                          <Hash className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs px-2 ${userLikes.has(post.id) ? "text-red-400" : "text-muted-foreground"}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={`h-3.5 w-3.5 mr-1 ${userLikes.has(post.id) ? "fill-red-400" : ""}`} />
                      {post.likes_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-muted-foreground"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      {post.comments_count}
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                  </div>

                  {/* Comments */}
                  {isExpanded && (
                    <div className="border-t border-border/40 pt-2 mt-1 space-y-2">
                      {postComments.map((c) => {
                        const cProfile = c.profiles as { full_name: string | null } | null;
                        return (
                          <div key={c.id} className="flex items-start gap-2 pl-2">
                            <Avatar className="h-5 w-5 mt-0.5">
                              <AvatarFallback className="text-[8px] bg-accent text-accent-foreground">
                                {getInitials(cProfile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium text-foreground">
                                  {cProfile?.full_name || "Anonymous"}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Comment input */}
                      {user && (
                        <div className="flex gap-2 pt-1">
                          <Input
                            placeholder="Write a comment..."
                            value={commentText[post.id] || ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            className="h-8 text-xs bg-background"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitComment(post.id);
                              }
                            }}
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => handleSubmitComment(post.id)}>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {posts.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No posts yet. Be the first to start a discussion!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CapitolCommunity;
