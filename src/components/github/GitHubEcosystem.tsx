import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Code2, Star, GitFork } from "lucide-react";
import { Github } from "@/lib/icons/brand-icons";
import { GITHUB_REPOSITORIES, GITHUB_USERNAME, getTotalRepoCount, type GitHubRepo } from '@/lib/github/repositories';

const GitHubEcosystem = () => {
  const [selectedCategory, setSelectedCategory] = useState(GITHUB_REPOSITORIES[0]?.name || '');
  const totalRepos = getTotalRepoCount();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Github className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Open Source Ecosystem</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalRepos}+ repositories powering AIQTP infrastructure
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://github.com/${GITHUB_USERNAME}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              View All
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 mb-4 flex-wrap gap-1">
              {GITHUB_REPOSITORIES.map((category) => (
                <TabsTrigger 
                  key={category.name} 
                  value={category.name}
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="mr-1.5">{category.icon}</span>
                  {category.name}
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                    {category.repos.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {GITHUB_REPOSITORIES.map((category) => (
            <TabsContent key={category.name} value={category.name} className="mt-0">
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
                  {category.repos.map((repo) => (
                    <RepoCard key={repo.name} repo={repo} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

const RepoCard = ({ repo }: { repo: GitHubRepo }) => {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 hover:border-primary/50 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {repo.name}
          </span>
        </div>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      {repo.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {repo.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>★</span>
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          <span>Fork</span>
        </span>
      </div>
    </a>
  );
};

export default GitHubEcosystem;
