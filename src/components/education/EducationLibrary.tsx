import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  Search,
  Play,
  Clock,
  Star,
  CheckCircle,
  Lock,
  TrendingUp,
  Brain,
  Shield,
  Coins,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  duration_minutes: number;
  lessons_count: number;
  is_premium: boolean;
  user_progress?: {
    lessons_completed: number;
    total_time_seconds: number;
  };
  avg_rating?: number;
  total_ratings?: number;
  enrolled_count?: number;
}

interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  read_time_minutes: number;
  created_at: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'basics': return <Coins className="h-5 w-5" />;
    case 'trading': return <TrendingUp className="h-5 w-5" />;
    case 'technical': return <BarChart3 className="h-5 w-5" />;
    case 'defi': return <Shield className="h-5 w-5" />;
    case 'risk': return <Shield className="h-5 w-5" />;
    case 'ai': return <Brain className="h-5 w-5" />;
    default: return <BookOpen className="h-5 w-5" />;
  }
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const EducationLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchEducationData();
  }, [user]);

  const fetchEducationData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('education_courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('education_articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;

      // If user is logged in, fetch their progress
      let userProgress: Record<string, { lessons_completed: number; total_time_seconds: number }> = {};
      if (user) {
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('course_id, lessons_completed, total_time_seconds')
          .eq('user_id', user.id);

        if (progressData) {
          userProgress = progressData.reduce((acc, p) => {
            acc[p.course_id] = {
              lessons_completed: p.lessons_completed,
              total_time_seconds: p.total_time_seconds
            };
            return acc;
          }, {} as Record<string, { lessons_completed: number; total_time_seconds: number }>);
        }
      }

      // Fetch ratings aggregated per course
      const { data: ratingsData } = await supabase
        .from('course_ratings')
        .select('course_id, rating');

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      if (ratingsData) {
        ratingsData.forEach(r => {
          if (!ratingsMap[r.course_id]) {
            ratingsMap[r.course_id] = { sum: 0, count: 0 };
          }
          ratingsMap[r.course_id].sum += r.rating;
          ratingsMap[r.course_id].count += 1;
        });
      }

      // Count enrolled users per course
      const { data: enrollmentData } = await supabase
        .from('user_course_progress')
        .select('course_id');

      const enrollmentMap: Record<string, number> = {};
      if (enrollmentData) {
        enrollmentData.forEach(e => {
          enrollmentMap[e.course_id] = (enrollmentMap[e.course_id] || 0) + 1;
        });
      }

      // Combine data
      const enrichedCourses = (coursesData || []).map(course => ({
        ...course,
        is_premium: course.is_premium || false,
        user_progress: userProgress[course.id],
        avg_rating: ratingsMap[course.id] 
          ? ratingsMap[course.id].sum / ratingsMap[course.id].count 
          : undefined,
        total_ratings: ratingsMap[course.id]?.count || 0,
        enrolled_count: enrollmentMap[course.id] || 0
      }));

      setCourses(enrichedCourses);
      setArticles(articlesData || []);
    } catch (err: any) {
      console.error('Error fetching education data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCourse = async (courseId: string) => {
    if (!user) {
      // Redirect to auth or show message
      return;
    }

    // Check if progress exists
    const existing = courses.find(c => c.id === courseId)?.user_progress;
    if (!existing) {
      // Create new progress record
      await supabase.from('user_course_progress').insert({
        user_id: user.id,
        course_id: courseId,
        lessons_completed: 0,
        total_time_seconds: 0
      });
      fetchEducationData();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-amber-500/10 text-amber-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalProgress = courses.reduce((sum, c) => sum + (c.user_progress?.lessons_completed || 0), 0);
  const totalLessons = courses.reduce((sum, c) => sum + c.lessons_count, 0);
  const completedCourses = courses.filter(c => 
    c.user_progress && c.user_progress.lessons_completed >= c.lessons_count && c.lessons_count > 0
  ).length;
  const totalLearningTime = courses.reduce((sum, c) => sum + (c.user_progress?.total_time_seconds || 0), 0);
  const learningHours = Math.floor(totalLearningTime / 3600);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading education data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Courses</p>
                <p className="text-xl sm:text-3xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl sm:text-3xl font-bold">{completedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Lessons</p>
                <p className="text-xl sm:text-3xl font-bold">{totalProgress}/{totalLessons || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Learning Time</p>
                <p className="text-xl sm:text-3xl font-bold">{learningHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state for no courses */}
      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Available Yet</h3>
            <p className="text-muted-foreground">
              Education courses will appear here once they are published by administrators.
            </p>
          </CardContent>
        </Card>
      )}

      {courses.length > 0 && (
        <>
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses and articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs defaultValue="courses">
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="courses" className="text-xs sm:text-sm">
                <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Courses</span>
                <span className="sm:hidden">Learn</span>
                <span className="ml-1">({courses.length})</span>
              </TabsTrigger>
              <TabsTrigger value="articles" className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Articles</span>
                <span className="sm:hidden">Read</span>
                <span className="ml-1">({articles.length})</span>
              </TabsTrigger>
              <TabsTrigger value="glossary" className="text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Glossary</span>
                <span className="sm:hidden">Terms</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              {/* Category Filter */}
              <div className="flex gap-2 mb-6">
                {['all', 'basics', 'trading', 'technical', 'defi', 'risk', 'ai'].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'All Courses' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Courses Grid */}
              {filteredCourses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No courses found matching your criteria.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {filteredCourses.map((course) => {
                    const progressPercent = course.lessons_count > 0 && course.user_progress
                      ? Math.round((course.user_progress.lessons_completed / course.lessons_count) * 100)
                      : 0;

                    return (
                      <Card key={course.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="p-2 rounded-lg bg-primary/10">
                              {getCategoryIcon(course.category)}
                            </div>
                            <div className="flex items-center gap-2">
                              {course.is_premium && (
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                              <Badge variant="outline" className={getLevelColor(course.level)}>
                                {course.level}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-lg mt-3">{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress */}
                          {course.user_progress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span>{progressPercent}%</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(course.duration_minutes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {course.lessons_count} lessons
                            </div>
                            {course.avg_rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                {course.avg_rating.toFixed(1)}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground/50">
                                <Star className="h-4 w-4" />
                                No ratings
                              </div>
                            )}
                          </div>

                          {/* Enrollment count */}
                          {course.enrolled_count > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {course.enrolled_count} student{course.enrolled_count !== 1 ? 's' : ''} enrolled
                            </p>
                          )}

                          <Button className="w-full" onClick={() => startCourse(course.id)}>
                            {course.user_progress ? (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Course
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="articles" className="mt-6">
              {articles.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No articles published yet.
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <Card key={article.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2">{article.category}</Badge>
                              <h3 className="font-semibold mb-1">{article.title}</h3>
                              <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.read_time_minutes} min
                              </div>
                              <p className="mt-1">{new Date(article.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="glossary" className="mt-6">
              <Card>
                <CardContent className="py-6">
                  <p className="text-muted-foreground text-center">
                    Trading glossary will be populated from the database.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default EducationLibrary;