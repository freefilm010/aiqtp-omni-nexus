import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'trading' | 'defi' | 'technical' | 'risk' | 'ai';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  completed: number;
  rating: number;
  enrolled: number;
  icon: React.ReactNode;
  isPremium?: boolean;
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: Date;
}

const courses: Course[] = [
  {
    id: 'crypto-101',
    title: 'Cryptocurrency Fundamentals',
    description: 'Learn the basics of blockchain technology, Bitcoin, and cryptocurrency markets.',
    category: 'basics',
    level: 'beginner',
    duration: '2h 30m',
    lessons: 12,
    completed: 8,
    rating: 4.9,
    enrolled: 15420,
    icon: <Coins className="h-5 w-5" />
  },
  {
    id: 'trading-strategies',
    title: 'Trading Strategies Masterclass',
    description: 'Master swing trading, day trading, and position trading strategies.',
    category: 'trading',
    level: 'intermediate',
    duration: '4h 15m',
    lessons: 18,
    completed: 5,
    rating: 4.8,
    enrolled: 8930,
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis Deep Dive',
    description: 'Chart patterns, indicators, and advanced TA techniques for crypto.',
    category: 'technical',
    level: 'intermediate',
    duration: '5h 45m',
    lessons: 24,
    completed: 0,
    rating: 4.7,
    enrolled: 12100,
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'defi-mastery',
    title: 'DeFi Protocol Mastery',
    description: 'Understand yield farming, liquidity pools, and DeFi strategies.',
    category: 'defi',
    level: 'advanced',
    duration: '6h 20m',
    lessons: 20,
    completed: 0,
    rating: 4.9,
    enrolled: 5680,
    icon: <Shield className="h-5 w-5" />,
    isPremium: true
  },
  {
    id: 'risk-management',
    title: 'Risk Management Essentials',
    description: 'Position sizing, stop losses, and portfolio risk management.',
    category: 'risk',
    level: 'beginner',
    duration: '1h 45m',
    lessons: 8,
    completed: 8,
    rating: 4.8,
    enrolled: 9450,
    icon: <Shield className="h-5 w-5" />
  },
  {
    id: 'ml-trading',
    title: 'Machine Learning for Trading',
    description: 'Apply ML models like LSTM and ensemble methods for price prediction.',
    category: 'ai',
    level: 'advanced',
    duration: '8h 30m',
    lessons: 32,
    completed: 0,
    rating: 4.9,
    enrolled: 3250,
    icon: <Brain className="h-5 w-5" />,
    isPremium: true
  }
];

const articles: Article[] = [
  { id: '1', title: 'Understanding Bitcoin Halving Events', excerpt: 'A comprehensive guide to Bitcoin halving and its historical price impact.', category: 'Fundamentals', readTime: '5 min', date: new Date() },
  { id: '2', title: 'How to Read Candlestick Patterns', excerpt: 'Master the art of reading Japanese candlestick patterns for trading.', category: 'Technical Analysis', readTime: '8 min', date: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Smart Contract Security Basics', excerpt: 'Learn how to evaluate smart contract security before investing.', category: 'Security', readTime: '6 min', date: new Date(Date.now() - 172800000) },
  { id: '4', title: 'Yield Farming Strategies for 2025', excerpt: 'Maximize your DeFi returns with these proven yield farming strategies.', category: 'DeFi', readTime: '10 min', date: new Date(Date.now() - 259200000) },
  { id: '5', title: 'Building Your First Trading Bot', excerpt: 'Step-by-step guide to creating automated trading strategies.', category: 'Automation', readTime: '15 min', date: new Date(Date.now() - 345600000) },
];

const EducationLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalProgress = courses.reduce((sum, c) => sum + c.completed, 0);
  const totalLessons = courses.reduce((sum, c) => sum + c.lessons, 0);
  const completedCourses = courses.filter(c => c.completed === c.lessons).length;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Courses Available</p>
                <p className="text-3xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Lessons Done</p>
                <p className="text-3xl font-bold">{totalProgress}/{totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Learning Time</p>
                <p className="text-3xl font-bold">12h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
        <TabsList>
          <TabsTrigger value="courses">
            <Video className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="articles">
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="glossary">
            <BookOpen className="h-4 w-4 mr-2" />
            Glossary
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
          <div className="grid grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {course.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      {course.isPremium && (
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
                  {course.completed > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{Math.round((course.completed / course.lessons) * 100)}%</span>
                      </div>
                      <Progress value={(course.completed / course.lessons) * 100} className="h-2" />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lessons} lessons
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      {course.rating}
                    </div>
                  </div>

                  <Button className="w-full">
                    {course.completed > 0 ? (
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="articles" className="mt-6">
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
                          {article.readTime}
                        </div>
                        <p className="mt-1">{article.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="glossary" className="mt-6">
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center">
                Trading glossary with 500+ terms coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationLibrary;
